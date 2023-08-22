require "capybara"
require "listen"

module Cyperful
  ROOT_DIR = File.expand_path("..", __dir__)

  @current = nil

  def self.current
    @current
  end
  def self.setup(test_class, test_name)
    puts "Setting up Cyperful for: #{test_class}##{test_name}"

    # must set `Cyperful.current` before calling `async_setup`
    @current ||= Cyperful::Driver.new
    @current.set_current_test(test_class, test_name)

    nil
  rescue => err
    unless err.is_a?(Cyperful::AbstractCommand)
      warn "Error setting up Cyperful:\n\n#{err.message}\n#{err.backtrace.slice(0, 4).join("\n")}\n"
    end

    raise err
  end

  def self.teardown(error = nil)
    @current&.teardown(error)
  end

  # more potential methods: https://www.rubydoc.info/github/jnicklas/capybara/Capybara/Session
  @step_at_methods = [*Capybara::Session::NODE_METHODS, :visit, :refresh]
  def self.step_at_methods
    @step_at_methods
  end
  def self.add_step_at_methods(*mods_or_methods)
    mods_or_methods.each do |mod_or_method|
      case mod_or_method
      when Module
        @step_at_methods +=
          mod_or_method.methods(false) + mod_or_method.instance_methods(false)
      when String, Symbol
        @step_at_methods << mod_or_method.to_sym
      else
        raise "Expected Module or Array of strings/symbols, got #{mod_or_method.class}"
      end
    end
  end
end

class Cyperful::AbstractCommand < StandardError
end
class Cyperful::ResetCommand < Cyperful::AbstractCommand
end
class Cyperful::ExitCommand < Cyperful::AbstractCommand
end

require "cyperful/test_parser"
require "cyperful/ui_server"
require "cyperful/driver"
require "cyperful/framework_injections"
