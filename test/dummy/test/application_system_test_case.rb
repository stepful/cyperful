require "test_helper"

CYPERFUL = !!ENV["CYPERFUL"]

require "cyperful/minitest" if CYPERFUL

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  include Cyperful::Minitest::SystemTestHelper if CYPERFUL

  driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
end
