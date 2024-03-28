# Cyperful

> The Capybara visual debugger

[![Gem Version](https://badge.fury.io/rb/cyperful.svg)](https://badge.fury.io/rb/cyperful)

An addon for Ruby Capybara system tests that adds the great DX of tools like Cypress.io.

## Features

- [x] View the list of steps in a test, with live updates as the test runs
- [x] Pause the test at each step and interact with the page
- [x] View API requests and console logs between steps
- [x] Auto-restart the test when the source code is modified
- [x] Records a video of the test so you can preview the finished test at that point in time _(experimental)_
- [ ] View and run ANY test suite from the UI _(coming soon)_
- [ ] Record browser interactions to save as ruby code _(coming later)_

## Framework support

Cyperful is in **BETA** and you will likely encounter issues/bugs! I have only confirmed it works on the default Rails testing stack: `Minitest` and `Capybara`.

Please open a Github issue if you'd like to see support for other test frameworks (such as RSpec) or any other specific setups.

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

- `reload_test_files` (default: `true`) - Reset the test when the test's source code is modified.
- `auto_run_on_reload` (default: `true`) - Automatically start the test when the source code is modified. Only applies if `reload_test_files` is `true`.
- `history_recording` (default: `true`) - Record a video of the test while it is running for debugging.

You can set these options on the `Cyperful.config` object after requiring the gem, e.g.:

```ruby
Cyperful.config.history_recording = false
```

## Development

```bash
# in a terminal, run the frontend dev server.
# this will watch for changes and rebuild the frontend
cd cyperful
pnpm run dev

# in another terminal, run any test.
# prepend `CYPERFUL_DEV=1` to tell cyperful to look at the
# dev server instead of the prebuilt frontend assets.
cd my_test_app
CYPERFUL_DEV=1 CYPERFUL=1 rails test test/system/my_test.rb
```
