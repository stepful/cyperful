module Cyperful::FrameworkHelper
  # Disable default screenshot on failure b/c we handle them ourselves.
  # https://github.com/rails/rails/blob/v7.0.1/actionpack/lib/action_dispatch/system_testing/test_helpers/screenshot_helper.rb#L156
  def take_failed_screenshot
    nil
  end
end
