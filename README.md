# Cyperful

> The Capybara visual debugger

[![Gem Version](https://badge.fury.io/rb/cyperful.svg)](https://badge.fury.io/rb/cyperful)

An addon for Ruby Capybara system tests that adds the great DX of tools like Cypress.io.

## Features

- [x] View the list of steps in a test, with live updates as the test runs
- [x] Pause the test at each step and interact with the page
- [x] View API requests and console logs between steps
- [x] Auto-restart the test when the source code is modified
- [x] Take a screenshot at each step so you can view the test at that point in time _(experimental)_
- [ ] View and run ANY test suite from the UI _(coming soon)_

## Testing frameworks

Currently, Cyperful only works with the default Rails testing stack: Minitest and Capybara. Please open an issue if you'd like to see support for other test frameworks such as RSpec.

## Installation

First, install the gem:

```bash
bundle add cyperful
```

In your `application_system_test_case.rb` file, add the following:

```ruby
CYPERFUL = !!ENV["CYPERFUL"]

require "cyperful" if CYPERFUL

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  include Cyperful::SystemTestHelper if CYPERFUL

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

- `reload_test_files` (default: `true`) - Reload the test files when the source code is modified
- `auto_run_on_reload` (default: `true`) - Automatically run the test when the source code is modified. Only applies if `reload_test_files` is `true`.
- `history_recording` (default: `true`) - Record a video of the test while it is running for debugging.

You can set these options on the `Cyperful.config` object after requiring the gem, e.g.:

```ruby
Cyperful.config.history_recording = false
```

## Development

```bash
# in a separate terminal, set up the frontend asset builder
cd cyperful/www
yarn watch

# in another terminal, run any test e.g.
CYPERFUL=1 rails test test/system/my_test.rb
```
