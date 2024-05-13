class RootController < ApplicationController
  def index
    render inline: "<h1>Hello, world!</h1>"
  end
end
