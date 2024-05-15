class Cyperful::Logger
  def puts(message = nil)
    # call puts method from Kernel module
    Kernel.puts("[cyperful] #{message}")
  end

  def warn(message = nil)
    Kernel.warn("[cyperful] #{message}")
  end

  def plain(message = nil)
    Kernel.puts(message)
  end
end
