require "cyperful"

module Cyperful::Rspec
  def self.configure(rspec_conf)
    rspec_conf.before(:example, type: :system) do
      # e.g. class = `RSpec::ExampleGroups::MyTest`
      # e.g. full_description = "my_test can visit root"
      example = RSpec.current_example
      Cyperful.setup(self.class, example.full_description)
    end

    rspec_conf.after(:example, type: :system) do
      example = RSpec.current_example
      error = example.exception

      # if error.is_a?(RSpec::Expectations::ExpectationNotMetError)
      #   error = error.error
      # end

      Cyperful.teardown(error)
    end
  end
end

Cyperful.add_step_at_methods(
  Capybara::RSpecMatchers.instance_methods(false),
  # Capybara::RSpecMatcherProxies.instance_methods(false),
)
