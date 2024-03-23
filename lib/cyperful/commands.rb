module Cyperful
  # @abstract
  class AbstractCommand < StandardError
  end

  class ResetCommand < AbstractCommand
  end
  class ExitCommand < AbstractCommand
  end
end
