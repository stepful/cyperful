require "rails_helper"

RSpec.describe "prefixed with RSpec.", type: :system do
  it "can visit root" do
    visit root_path

    expect(page).to have_text("Hello, World!")
  end
end
