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

# The Minitest test helper.
# TODO: support other test frameworks like RSpec
module Cyperful::SystemTestHelper
  def setup
    Cyperful.setup(self.class, self.method_name)
    super
  end

  def teardown
    error = passed? ? nil : failure

    error = error.error if error.is_a?(Minitest::UnexpectedError)

    Cyperful.teardown(error)
    super
  end

  # Disable default screenshot on failure b/c we handle them ourselves.
  # https://github.com/rails/rails/blob/main/actionpack/lib/action_dispatch/system_testing/test_helpers/screenshot_helper.rb#L156
  def take_failed_screenshot
    nil
  end
end

# we need to allow the iframe to be embedded in the cyperful server
# TODO: use Rack middleware instead to support non-Rails apps
if defined?(Rails)
  Rails.application.config.content_security_policy do |policy|
    policy.frame_ancestors(:self, "localhost:3004")
  end
else
  warn "Cyperful: Rails not detected, skipping content_security_policy fix.\nThe Cyperful UI may not work correctly."
end

# fix for: Set-Cookie (SameSite=Lax) doesn't work when within an iframe with host 127.0.0.1
Capybara.server_host = "localhost"
