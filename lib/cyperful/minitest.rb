require "cyperful"
require "capybara/minitest"

module Cyperful::Minitest # rubocop:disable Style/ClassAndModuleChildren
  module SystemTestHelper
    include Cyperful::FrameworkHelper

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
  end
end

Cyperful.add_step_at_methods(
  Capybara::Minitest::Assertions.instance_methods(false),
)

# if defined?(Minitest::Test)
#   Minitest::Test::PASSTHROUGH_EXCEPTIONS << Cyperful::AbstractCommand
# end
