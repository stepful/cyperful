require "test_helper"

require "cyperful/minitest"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  include Cyperful::Minitest::SystemTestHelper

  driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
end
