require "cyperful"
require "capybara/minitest"

module Cyperful::Minitest # rubocop:disable Style/ClassAndModuleChildren
  module SystemTestHelper
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
end

Cyperful.add_step_at_methods(
  Capybara::Minitest::Assertions.instance_methods(false),
)

# if defined?(Minitest::Test)
#   Minitest::Test::PASSTHROUGH_EXCEPTIONS << Cyperful::AbstractCommand
# end
