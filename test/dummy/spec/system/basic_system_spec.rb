require "rails_helper"

describe "basic", type: :system do
  it "can visit root" do
    visit root_path

    expect(false).to be_truthy

    expect(page).to have_text("Hello, world!")
  end
end
