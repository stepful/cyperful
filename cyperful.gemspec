Gem::Specification.new("cyperful", "0.1.0") do |s|
  s.summary = "Cypress-esque testing for Capybara tests"
  s.authors = ["me@wyattades.com"]
  s.required_ruby_version = ">= 3"
  s.files = Dir["lib/**/*.rb", "watcher.js", "public"]
  s.add_dependency("capybara", "~> 3")
  s.add_dependency("listen", "~> 3")
  s.add_dependency("webrick-websocket", "~> 0.0.3")
end
