require "action_dispatch/system_testing/driver"

# we need to override the some Capybara::Session methods because they
# control the top-level browser window, but we want them
# to control the iframe instead
module PrependCapybaraSession
  def visit(url)
    return if Cyperful.current&.internal_visit(url)
    super
  end

  def current_url
    url = Cyperful.current&.internal_current_url
    return url if url
    super
  end

  def refresh
    return if Cyperful.current&.internal_visit(current_url)
    super
  end

  def go_back
    super
    Cyperful.current&.drive_iframe
  end
end
Capybara::Session.prepend(PrependCapybaraSession)

module PrependCapybaraWindow
  # this solves a bug in Capybara where it doesn't
  # return to driving the iframe after a call to `Window#close`
  def close
    super
    Cyperful.current&.drive_iframe
  end
end
Capybara::Window.prepend(PrependCapybaraWindow)

module PrependSystemTestingDriver
  def initialize(...)
    super(...)

    # SUPER NAIVE way to include the width/height of the sidebar/header
    # in the new screen size
    @screen_size = [@screen_size.fetch(0) + 300, @screen_size.fetch(1) + 60]

    prev_capabilities = @capabilities
    @capabilities =
      proc do |driver_opts|
        prev_capabilities&.call(driver_opts)

        next unless driver_opts.respond_to?(:add_argument)

        # this assumes Selenium and Chrome:

        # so user isn't prompted when we start recording video w/ MediaStream
        driver_opts.add_argument("--auto-accept-this-tab-capture")
        driver_opts.add_argument("--use-fake-ui-for-media-stream")

        # make sure we're not in headless mode
        driver_opts.args.delete("--headless")
        driver_opts.args.delete("--headless=new")

        # hide the "Chrome is being controlled by automated test software" infobar
        driver_opts.args.delete("--enable-automation")
        driver_opts.exclude_switches << "enable-automation"
      end
  end
end
ActionDispatch::SystemTesting::Driver.prepend(PrependSystemTestingDriver)

# fix for: Set-Cookie (SameSite=Lax) doesn't work when within an iframe with host 127.0.0.1
Capybara.server_host = "localhost"
