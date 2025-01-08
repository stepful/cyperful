Rails.application.routes.draw do
  # Defines the root path route ("/")
  root "root#index"

  post "some_data", to: "root#some_data"
end
