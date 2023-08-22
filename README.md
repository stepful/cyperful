# Cyperful

An addon for Ruby Capybara system tests that adds some of the DX capabilities of Cypress.io.

## Features

- [x] View the list of steps in a test, with live updates as the test runs
- [x] Pause the test at each step and interact with the page
- [x] View API requests and console logs between steps
- [x] Reset the test when the source code is modified
- [ ] Take a screenshot at each step so you can view the test at that point in time
- [ ] View and run ANY test suite from the UI

## Installation

Before you can run Cyperful, you'll need to build the frontend assets:

```bash
cd cyperful/www

# Install dependencies
yarn

# Build the frontend assets
yarn build
```

(If we release this as a gem, we'll include the frontend assets in the gem, so you won't need to build them yourself.)

## Usage

In your `application_system_test_case.rb` file, add the following:

```ruby
CYPERFUL = !!ENV["CYPERFUL"]

require "cyperful" if CYPERFUL

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  include Cyperful::SystemTestHelper if CYPERFUL

  # Also, make sure headless mode is NOT enabled if `CYPERFUL` is true

  # ...
end
```

Then, run a test with `CYPERFUL` env var, e.g.:

```bash
CYPERFUL=1 rails test test/system/my_test.rb:123
```

🚨 **IMPORTANT NOTE:**
Cyperful currently works best when you run a single test at a time i.e. your test file contains only 1 test OR you specify a single test with `<filename>:<line_number>`. A better DX for running multiple sequential tests is coming soon.

## Development

```bash
# in a separate terminal, set up the frontend asset builder
cd cyperful/www
yarn watch

# in another terminal, run any test e.g.
CYPERFUL=1 rails test test/system/my_test.rb
```
