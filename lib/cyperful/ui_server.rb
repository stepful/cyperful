require "webrick/websocket"
require "webrick/httpproxy"

class Cyperful::UiServer
  def initialize(port:)
    @port = port

    @notify_queue = Queue.new

    build_server
  end

  def url_origin
    "http://localhost:#{@port}"
  end

  def notify(data)
    @notify_queue.enq(data)
  end

  def on_command(&block)
    @on_command = block
  end

  private def build_server
    @server =
      WEBrick::Websocket::HTTPServer.new(
        Port: @port,
        Logger: WEBrick::Log.new("/dev/null"),
        AccessLog: [],
        **unless Cyperful::DEV_MODE
          {
            DocumentRoot: File.join(Cyperful::ROOT_DIR, "public"),
            DocumentRootOptions: {
              FancyIndexing: false,
            },
          }
        end || {},
      )

    notify_queue = @notify_queue

    sock_num_counter = 0
    open_sockets = []

    @server.mount(
      "/api/websocket",
      Class.new(WEBrick::Websocket::Servlet) do
        # use `define_method` so we can access outer scope variables i.e. `notify_queue`
        define_method(:socket_open) do |sock|
          # this would be an unexpected state,
          # at the moment it's not possible to have more than one client connected.
          # TODO: handle the client unexpectedly disconnecting e.g. user changes browser url
          if open_sockets.length > 0
            raise "websockets already open: #{open_sockets}. You probably need to restart."
          end

          sock_num = sock_num_counter
          sock_num_counter += 1

          open_sockets << sock_num
          sock.instance_variable_set(:@sock_num, sock_num)

          # puts "Websocket #{sock_num} opened."
          loop do
            data = notify_queue.deq

            # puts "Websocket #{sock_num} got: #{data.class.name}"
            break unless data
            sock.puts(data.to_json)
          end
        rescue => err
          warn "Error in websocket #{sock_num}: #{err}"
          sock.close
        end

        define_method(:socket_close) do |sock|
          sock_num = sock.instance_variable_get(:@sock_num)

          # puts "Websocket #{sock_num} closed!"
          open_sockets.delete(sock_num)
        end
      end,
    )

    # should we use websocket events for this?
    @server.mount_proc("/api/steps/command") do |req, res|
      if req.request_method != "POST"
        res.body = "Only POST allowed"
        res.status = 405
        next
      end

      command, params = JSON.parse(req.body).values_at("command", "params")

      if @on_command
        begin
          @on_command.call(command, params)
        rescue => err
          res.body = "Error: #{err}"
          res.status = 500
          next
        end
      end

      res.status = 204
    end

    @server.mount_proc("/api/config") do |req, res|
      if req.request_method != "GET"
        res.body = "Only POST allowed"
        res.status = 405
        next
      end

      res.body = Cyperful.config.to_h.to_json
      res["Content-Type"] = "application/json"
      res.status = 200
    end

    if Cyperful::DEV_MODE
      @server.mount("/", ReverseProxy, target_url: "http://localhost:3005")
    end
  end

  def start_async
    # start server in background i.e. non-blocking
    @thread =
      Thread.new do
        Thread.current.abort_on_exception = true
        @server.start
      end
  end

  def shutdown
    @thread&.kill

    @server.shutdown
  end

  # super naive reverse proxy
  class ReverseProxy < WEBrick::HTTPServlet::AbstractServlet
    def initialize(server, config = {})
      super
      @target_url = config.fetch(:target_url)
      @forward_headers = config[:forward_headers] || ["accept"]
    end

    def do_GET(request, response)
      # Target server URL
      target_uri = URI(@target_url)
      target_uri.path = request.path
      target_uri.query = request.query_string if request.query_string

      # Create a new request to the target server with the original request path
      target_request = Net::HTTP::Get.new(target_uri)
      @forward_headers.each do |header|
        target_request[header] = request[header]
      end

      # Send the request to the target server
      target_response =
        Net::HTTP.start(target_uri.host, target_uri.port) do |http|
          http.request(target_request)
        end

      # Set the response from the target server as the response to send back to the client
      response.status = target_response.code.to_i
      response["Content-Type"] = target_response["content-type"]
      response.body = target_response.body
    end
  end
end
