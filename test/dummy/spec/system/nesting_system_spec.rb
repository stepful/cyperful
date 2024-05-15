require "rails_helper"

describe "nesting", type: :system do
  context "some context" do
    it "can visit root" do
      visit root_path

      expect(page).to have_text("Hello, World!")

      begin
        expect(page).to have_text("Hello")
      ensure
        expect(page).to have_text("Hello,")
      end

      within "h1" do
        expect(page).to have_text("Hello, W")
      end
    end
  end

  it "foo bar" do
    visit root_path
  end
end
