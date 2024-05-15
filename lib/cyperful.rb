require "capybara"
require "listen"

module Cyperful
  ROOT_DIR = File.expand_path("..", __dir__)

  # Add `CYPERFUL_DEV=1` to use the Vite dev hot-reloading server
  # instead of the pre-built files in `public/`
  DEV_MODE = !!ENV["CYPERFUL_DEV"]

  @current = nil

  class Config < Struct.new(
    :port,
    :auto_run_on_reload,
    :reload_test_files,
    # :reload_source_files, # not implemented yet
    :editor_scheme,
    :history_recording, # EXPERIMENTAL
    keyword_init: true,
  )
    def initialize
      super(
        port: 3004,
        auto_run_on_reload: true,
        reload_test_files: true,
        editor_scheme: "vscode",
        history_recording: true,
      )
    end
  end
  def self.config
    @config ||= Config.new
  end

  def self.logger
    @logger ||= Cyperful::Logger.new
  end

  def self.test_framework
    @test_framework || raise("Cyperful not set up yet")
  end
  def self.rspec?
    @test_framework == :rspec
  end
  def self.minitest?
    @test_framework == :minitest
  end

  def self.current
    @current
  end
  def self.setup(test_class, test_name)
    @test_framework =
      if defined?(RSpec::Core::ExampleGroup) &&
           test_class < RSpec::Core::ExampleGroup
        :rspec
      elsif defined?(ActiveSupport::TestCase) &&
            test_class < ActiveSupport::TestCase
        :minitest
      else
        raise "Unsupported test framework for class: #{test_class.name}"
      end

    logger.puts "init test: \"#{rspec? ? test_name : "#{test_class}##{test_name}"}\""

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
require "cyperful/logger"
require "cyperful/test_parser"
require "cyperful/ui_server"
require "cyperful/driver"
require "cyperful/framework_helper"
require "cyperful/framework_injections"
require "cyperful/railtie" if defined?(Rails::Railtie)
