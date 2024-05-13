require "application_system_test_case"

class BasicSystemTest < ApplicationSystemTestCase
  test "can visit root" do
    visit root_path
    assert_text "Hello, world!"
  end
end
