require "minitest/autorun"

module Cyperful
end
require "cyperful/test_parser"

# TODO: write tests

describe "meta" do
  it "can load cyperful" do
    assert Cyperful.config
  end
end
