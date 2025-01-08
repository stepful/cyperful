require "rails_helper"

describe "request wrap system spec", type: :system do
  it "wraps fetch requests" do
    visit root_path

    click_button("Data via fetch")
    expect(page).to have_text("1,2,3")

    refresh

    click_button("Data via XHR")
    expect(page).to have_text("1,2,3")
  end
end
