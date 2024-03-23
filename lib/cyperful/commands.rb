module Cyperful
  # @abstract
  class AbstractCommand < StandardError
    # don't print normal error/backtrace
    def to_s
      command_name =
        self.class.name.split("::").last.chomp("Command").underscore
      "(Captured cyperful command: #{command_name})"
    end
    def backtrace
      []
    end
  end

  class ResetCommand < AbstractCommand
  end
  class ExitCommand < AbstractCommand
  end
end
