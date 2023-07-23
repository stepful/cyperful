require "webrick/websocket"

module FixWebrickWebsocketServer
  def service(req, res)
    # fix for: webrick-websocket incorrectly assumes `Upgrade` header is always present
    req.header["upgrade"] = [""] if req["upgrade"].nil?
    super
  end
end
WEBrick::Websocket::HTTPServer.prepend(FixWebrickWebsocketServer)

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
        DocumentRoot: File.expand_path("../../public", __dir__),
        Logger: WEBrick::Log.new("/dev/null"),
        AccessLog: [],
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
            warn "Warning: websockets already open: #{open_sockets}. You probably need to restart."
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
end
