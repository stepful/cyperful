Gem::Specification.new do |s|
  s.name = "cyperful"
  s.version = "0.1.0"
  s.summary = "Cypress-esque testing for Capybara tests"
  s.homepage = "https://github.com/stepful/cyperful"
  s.license = "MIT"
  s.authors = ["Wyatt Ades"]
  s.required_ruby_version = ">= 3"

  s.files = Dir["lib/**/*.rb", "watcher.js", "public"]

  s.add_dependency("capybara", "~> 3")
  s.add_dependency("listen", "~> 3")
  s.add_dependency("webrick-websocket", "~> 0.0.3")
end
