require "capybara"
require "listen"

module Cyperful
  ROOT_DIR = File.expand_path("..", __dir__)

  @current = nil

  class Config < Struct.new(
    :port,
    :auto_run_on_reload,
    :reload_test_files,
    # :reload_source_files, # not implemented yet
    :history_recording, # EXPERIMENTAL
    keyword_init: true,
  )
    def initialize
      super(
        port: 3004,
        auto_run_on_reload: true,
        reload_test_files: true,
        history_recording: true,
      )
    end
  end
  def self.config
    @config ||= Config.new
  end

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

  def self.add_step_at_methods(*mods_or_methods)
    Cyperful::TestParser.add_step_at_methods(*mods_or_methods)
  end
end

require "cyperful/commands"
require "cyperful/test_parser"
require "cyperful/ui_server"
require "cyperful/driver"
require "cyperful/framework_injections"
