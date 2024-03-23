class Cyperful::Driver
  attr_reader :steps, :pausing

  SCREENSHOTS_DIR = File.join(Cyperful::ROOT_DIR, "public/screenshots")

  def initialize
    @step_pausing_queue = Queue.new

    @session = Capybara.current_session
    raise "Could not find Capybara session" unless @session

    setup_api_server
  end

  def set_current_test(test_class, test_name)
    @test_class = test_class
    @test_name = test_name.to_sym

    @source_filepath =
      Object.const_source_location(test_class.name).first ||
        (raise "Could not find source file for #{test_class.name}")

    reset_steps

    print_steps

    @session.visit(@cyperful_origin)
    drive_iframe

    # after we setup our UI, send the initialization data
    notify_updated_steps

    setup_tracing

    setup_file_listener

    # Sanity check
    unless @step_pausing_queue.empty?
      raise "step_pausing_queue is not empty during setup"
    end

    # Wait for the user to click "Start"
    step_pausing_dequeue
  end

  def step_pausing_dequeue
    command = @step_pausing_queue.deq
    if command == :reset
      raise Cyperful::ResetCommand
    elsif command == :exit
      raise Cyperful::ExitCommand
    elsif command == :next
      # just continue
    else
      raise "unknown command: #{command}"
    end
  end

  def reset_steps
    # TODO: memoize this when there's multiple tests per file
    @steps =
      Cyperful::TestParser.new(@test_class).steps_per_test.fetch(@test_name)

    editor = "vscode" # TODO: support other editors?

    @steps.each_with_index do |step, i|
      step.merge!(
        index: i,
        status: "pending",
        start_at: nil,
        end_at: nil,
        paused_at: nil,
        permalink: "#{editor}://file/#{@source_filepath}:#{step.fetch(:line)}",
      )
    end

    # NOTE: there can be multiple steps per line, this takes the last instance
    @step_per_line = @steps.index_by { |step| step[:line] }

    @current_step = nil

    @pause_at_step = true

    @test_result = nil

    # reset SCREENSHOTS_DIR
    FileUtils.rm_rf(SCREENSHOTS_DIR)
    FileUtils.mkdir_p(SCREENSHOTS_DIR)
  end

  def queue_reset
    # FIXME: there may be other tests that are "queued" to run `at_exit`,
    # so they'll run before this test restarts.
    at_exit { Minitest.run_one_method(@test_class, @test_name) }
  end

  # subscribe to the execution of each line of code in the test.
  # this let's us notify the frontend of the line's status, and pause execution if needed.
  def setup_tracing
    @tracepoint&.disable

    @tracepoint =
      TracePoint.new(:line) do |tp|
        next if @source_filepath.nil? || tp.path != @source_filepath

        finish_current_step

        step = @step_per_line[tp.lineno]
        pause_on_step(step) if step
      end
    @tracepoint.enable
  end

  # Every time a file changes the `test/` directory, reset this test
  # TODO: add an option to auto-run on reload
  def setup_file_listener
    # TODO: we need to somehow reload the source files

    # test_dir = @source_filepath.match(%r{^/.+/(?:test|spec)\b})[0]

    # @file_listener&.stop
    # @file_listener =
    #   Listen.to(test_dir) do |_modified, _added, _removed|
    #     puts "Test files changed, resetting test..."

    #     @pause_at_step = true
    #     @step_pausing_queue.enq(:reset)
    #   end
    # @file_listener.start
  end

  def print_steps
    puts "Found #{@steps.length} steps:"
    @steps.each_with_index do |step, i|
      puts " #{
             (i + 1).to_s.rjust(2)
           }.  #{step[:method]}: #{step[:line]}:#{step[:column]}"
    end
    puts
  end

  # pending (i.e. test hasn't started), paused, running, passed, failed
  def test_status
    return @test_result[:status] if @test_result # passed or failed

    if @pause_at_step
      return "running" if @steps.any? { |step| step[:status] == "running" }

      return "pending" unless @current_step
      return "paused"
    end

    "running"
  end

  private def test_duration_ms
    start_at = @steps.first&.[](:start_at)
    return nil unless start_at
    last_ended_step_i = @steps.rindex { |step| step[:end_at] }
    return nil unless last_ended_step_i

    end_at = @steps[last_ended_step_i][:end_at]

    duration = end_at - start_at

    @steps.each_with_index do |step, i|
      next if i == 0 || i > last_ended_step_i
      if step[:paused_at] && step[:start_at]
        duration -= (step[:start_at] - step[:paused_at])
      end
    end

    duration
  end

  def steps_updated_data
    status = self.test_status
    {
      event: "steps_updated",
      steps: @steps,
      current_step_index: @current_step&.[](:index),
      pause_at_step: @pause_at_step,
      test_suite: @test_class.name,
      test_name: @test_name,
      test_status: status,
      test_error: @test_result&.[](:error)&.to_s,
      test_duration_ms: test_duration_ms,
    }
  end

  private def notify_updated_steps
    @ui_server.notify(steps_updated_data)
  end

  private def finish_current_step(error = nil)
    if @current_step
      @current_step[:end_at] = (Time.now.to_f * 1000.0).to_i
      @current_step[:status] = !error ? "passed" : "failed"

      # take screenshot after the step has finished
      # path = File.join(SCREENSHOTS_DIR, "#{@current_step[:index]}.png")

      # FIXME: this adds ~200ms to each step! disabling it for now
      # @session.save_screenshot(path)

      # this adds ~70ms to each step, but causes a weird flash on the screen
      # @session.find(:css, "body").base.native.save_screenshot(path)

      @current_step = nil
    end

    notify_updated_steps
  end

  def pause_on_step(step)
    @current_step = step

    puts "STEP #{(step[:index] + 1).to_s.rjust(2)}: #{step[:as_string]}"

    if @pause_at_step == true || @pause_at_step == step[:index]
      @current_step[:paused_at] = (Time.now.to_f * 1000.0).to_i
      @current_step[:status] = "paused"
      notify_updated_steps

      # async wait for `continue_next_step`
      step_pausing_dequeue
    end

    @current_step[:status] = "running"
    @current_step[:start_at] = (Time.now.to_f * 1000.0).to_i
    notify_updated_steps
  end

  private def continue_next_step
    @step_pausing_queue.enq(:next)
  end

  def drive_iframe
    puts "Driving iframe..."

    # make sure a `within` block doesn't affect these commands
    without_finder_scopes do
      @session.switch_to_frame(
        # `find` waits for the iframe to load
        @session.find(:css, "iframe#scenario-frame"),
      )
    end

    @driving_iframe = true
  end

  private def without_finder_scopes(&block)
    scopes = @session.send(:scopes)
    before_scopes = scopes.dup
    scopes.reject! { |el| el.is_a?(Capybara::Node::Element) }
    block.call
  ensure
    scopes.clear
    scopes.push(*before_scopes)
  end

  # forked from: https://github.com/teamcapybara/capybara/blob/master/lib/capybara/session.rb#L264
  private def make_absolute_url(visit_uri)
    visit_uri = ::Addressable::URI.parse(visit_uri.to_s)
    base_uri =
      ::Addressable::URI.parse(@session.config.app_host || @session.server_url)

    if base_uri && [nil, "http", "https"].include?(visit_uri.scheme)
      if visit_uri.relative?
        visit_uri_parts = visit_uri.to_hash.compact

        # Useful to people deploying to a subdirectory
        # and/or single page apps where only the url fragment changes
        visit_uri_parts[:path] = base_uri.path + visit_uri.path

        visit_uri = base_uri.merge(visit_uri_parts)
      end
      # adjust_server_port(visit_uri)
    end

    abs_url = visit_uri.to_s

    display_url = abs_url.sub(base_uri.to_s, "")

    [abs_url, display_url]
  end

  WATCHER_JS = File.read(File.join(Cyperful::ROOT_DIR, "watcher.js"))

  private def skip_multi_sessions
    unless Capybara.current_session == @session
      warn "Skipped Cyperful setup in non-default session: #{Capybara.session_name}"
      return true
    end
    false
  end

  def internal_visit(url)
    return false unless @driving_iframe
    return false if skip_multi_sessions

    abs_url, display_url = make_absolute_url(url)

    # show the actual `visit` url as soon as it's computed
    if @current_step && @current_step[:method] == :visit
      @current_step[:as_string] = "visit #{display_url.to_json}"
      notify_updated_steps
    end

    @session.execute_script("window.location.href = #{abs_url.to_json}")

    # inject the watcher script into the page being tested.
    # this script will notify the Cyperful UI for events like:
    # console logs, network requests, client navigations, errors, etc.
    @session.execute_script(WATCHER_JS) # ~9ms empirically

    true
  end

  def internal_current_url
    return nil unless @driving_iframe
    return nil if skip_multi_sessions

    @session.evaluate_script("window.location.href")
  end

  def setup_api_server
    @ui_server = Cyperful::UiServer.new(port: 3004)

    @cyperful_origin = @ui_server.url_origin

    @ui_server.on_command do |command, params|
      case command.to_sym
      when :start
        # one of: integer (index of a step), true (pause at every step), or nil (don't pause)
        @pause_at_step = params["pause_at_step"]

        continue_next_step
      when :reset
        @pause_at_step = true
        @step_pausing_queue.enq(:reset)
      when :stop
        @pause_at_step = true # enable pausing
      when :exit
        @pause_at_step = true

        # instead of calling `exit` directly, we need to raise a Cyperful::ExitCommand error
        # so Minitest can finish it's teardown e.g. to reset the database
        @step_pausing_queue.enq(:exit)
      else
        raise "unknown command: #{command}"
      end
    end

    @ui_server.start_async

    # The server appears to always stop on it's own,
    # so we don't need to stop it within an `at_exit` or `Minitest.after_run`

    puts "Cyperful server started: #{@cyperful_origin}"
  end

  def teardown(error = nil)
    @tracepoint&.disable
    @tracepoint = nil

    if error&.is_a?(Cyperful::ResetCommand)
      puts "\nPlease ignore the error, we're just resetting the test ;)"

      @ui_server.notify(nil) # `break` out of the `loop` (see `UiServer#socket_open`)

      queue_reset
      return
    end

    return if error&.is_a?(Cyperful::ExitCommand)

    if error
      # get the 4 lines following the first line that includes the source file
      i = nil
      backtrace = []
      error.backtrace.each do |s|
        i ||= 0 if s.include?(@source_filepath)
        next unless i
        i += 1
        backtrace << s
        break if i >= 6
      end

      warn "\n\nTest failed with error:\n#{error.message}\n#{backtrace.join("\n")}"
    end

    @test_result = { status: error ? "failed" : "passed", error: error }

    finish_current_step(error)

    @ui_server.notify(nil) # `break` out of the `loop` (see `UiServer#socket_open`)

    puts "Cyperful teardown complete. Waiting for command..."
    command = @step_pausing_queue.deq
    queue_reset if command == :reset
  ensure
    @file_listener&.stop
    @file_listener = nil
  end
end
