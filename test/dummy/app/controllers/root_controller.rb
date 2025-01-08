class RootController < ApplicationController
  def index
  end

  def some_data
    numbers = params[:numbers].map(&:to_i)

    respond_to do |format|
      format.json { render json: { data: numbers } }
      format.html do
        render html:
                 "<ul>#{numbers.map { |n| "<li>#{n}</li>" }.join("")}</ul>".html_safe
      end
    end
  end
end
