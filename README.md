# Cyperful

> The Capybara visual debugger

[![Gem Version](https://badge.fury.io/rb/cyperful.svg)](https://badge.fury.io/rb/cyperful)

An addon for Ruby Capybara system tests that adds the great DX of tools like Cypress.io.

https://github.com/stepful/cyperful/assets/992076/dd1ef39c-98ca-48f3-8c3d-99ae057594e2

## Features

- [x] View the list of steps in a test, with live updates as the test runs
- [x] Pause the test at each step and interact with the page
- [x] View API requests and console logs between steps
- [x] Auto-restart the test when the source code is modified
- [x] Records a video of the test so you can preview the finished test at that point in time _(experimental)_
- [ ] View and run ANY test suite from the UI _(coming soon)_
- [ ] Record browser interactions to save as ruby code _(coming later)_

## Framework support

🚨 Cyperful is in **BETA** and you will likely encounter issues/bugs! We currently only support: Rails 7.1, Ruby 3.2.1, `Minitest`/`RSpec`, `capybara`, and `selenium` with Chrome.

Try it out, then please open a Github issue if you'd like to see support for any other specific frameworks/setups.

## Installation

First, install the gem (with require=false):

```Gemfile
group :test do
  gem "cyperful", require: false
end
```

Follow the instructions for your test framework:

### RSpec

In your `rails_helper.rb` file, add the following:

```ruby
CYPERFUL = !!ENV["CYPERFUL"]

require "cyperful/rspec" if CYPERFUL

RSpec.configure do |config|
  # make sure we setup the browser-driver BEFORE Cyperful's setup
  config.prepend_before(:example, type: :system) do
    # Cyperful only supports Selenium + Chrome
    driven_by :selenium, using: :chrome, screen_size: [1400, 1400]
  end

  # ...
end
```

### Minitest

In your `application_system_test_case.rb` file, add the following:

```ruby
CYPERFUL = !!ENV["CYPERFUL"]

require "cyperful/minitest" if CYPERFUL

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  include Cyperful::Minitest::SystemTestHelper if CYPERFUL

  # Cyperful only supports Selenium + Chrome
  driven_by :selenium, using: :chrome, screen_size: [1400, 1400]

  # ...
end
```

## Usage

Run a test with `CYPERFUL` env var, e.g.:

```bash
CYPERFUL=1 rails test test/system/my_test.rb:123
```

🚨 **IMPORTANT NOTE:**
Cyperful currently works best when you run a single test at a time i.e. your test file contains only 1 test OR you specify a single test with `<filename>:<line_number>`. A better DX for running multiple sequential tests is coming soon.

## Config

Config options:

- `reload_test_files` (default: `true`) - Reset the test when the test's source code is modified.
- `auto_run_on_reload` (default: `true`) - Automatically start the test when the source code is modified. Only applies if `reload_test_files` is `true`.
- `history_recording` (default: `true`) - Record a video of the test while it is running for debugging.

You can set these options on the `Cyperful.config` object after requiring the gem, e.g.:

```ruby
Cyperful.config.history_recording = false
```

---

## Contributing

1. Fork this repo
2. Create your feature branch (git checkout -b my-new-feature)
3. Commit your changes (git commit -am 'Add some feature')
4. Push to the branch (git push origin my-new-feature)
5. Create a new Pull Request

### Run the dev server

```bash
# in a terminal, run the frontend dev server.
# this will watch for changes and rebuild the frontend
cd cyperful
pnpm run dev

# in another terminal, run any Rspec/Minitest test
# prepend `CYPERFUL_DEV=1` to tell cyperful to look at the
# dev server instead of the prebuilt frontend assets.
cd test/dummy
CYPERFUL_DEV=1 CYPERFUL=1 rails test test/system/basic_system_test.rb

# Or, run your own tests in your own app.
cd path/to/your_app
bundle config local.cyperful path/to/cyperful_repo
bundle install
CYPERFUL_DEV=1 CYPERFUL=1 rspec path/to/my_system_spec.rb
```
