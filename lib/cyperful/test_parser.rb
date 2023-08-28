require "parser/current"
require "capybara/minitest"

class Cyperful::TestParser
  # see docs for methods: https://www.rubydoc.info/github/jnicklas/capybara/Capybara/Session
  @step_at_methods =
    Capybara::Session::DSL_METHODS.to_set +
      Capybara::Minitest::Assertions.instance_methods(false) -
      # exclude methods that don't have side-effects i.e. don't modify the page:
      %i[
        body
        html
        source
        current_url
        current_host
        current_path
        current_scope
        status_code
        response_headers
      ]

  def self.step_at_methods
    @step_at_methods
  end
  def self.add_step_at_methods(*mods_or_methods)
    mods_or_methods.each do |mod_or_method|
      case mod_or_method
      when Module
        @step_at_methods +=
          mod_or_method.methods(false) + mod_or_method.instance_methods(false)
      when String, Symbol
        @step_at_methods << mod_or_method.to_sym
      else
        raise "Expected Module or Array of strings/symbols, got #{mod_or_method.class}"
      end
    end
  end

  def initialize(test_class)
    @test_class = test_class
    @source_filepath = Object.const_source_location(test_class.name).first
  end

  def steps_per_test
    ast = Parser::CurrentRuby.parse(File.read(@source_filepath))

    test_class_name = @test_class.name.to_sym

    system_test_class =
      ast.children.find do |node|
        if node.type == :class
          node.children.find do |c|
            c.type == :const && c.children[1] == test_class_name
          end
        end
      end
    unless system_test_class
      raise "Could not find class #{test_class.name} in #{@source_filepath}"
    end

    (
      # the children of the `class` node are either:
      # - a `begin` node if there's more than 1 child node
      # - or the one 0 or 1 child node
      system_test_class
        .children
        .find { |node| node.type == :begin }
        &.children || [system_test_class.children[2]].compact
    )
      .map do |node|
        # e.g. `test "my test" do ... end`
        if node.type == :block && node.children[0].type == :send &&
             node.children[0].children[1] == :test
          test_string = node.children[0].children[2].children[0]

          # https://github.com/rails/rails/blob/66676ce499a32e4c62220bd05f8ee2cdf0e15f0c/activesupport/lib/active_support/testing/declarative.rb#L14C23-L14C61
          test_method = "test_#{test_string.gsub(/\s+/, "_")}".to_sym

          block_node = node.children[2]
          [test_method, block_node]
        else
          # e.g. `def test_my_test; ... end`
          # TODO
        end
      end
      .compact
      .to_h do |test_method, block_node|
        out = []
        block_node.children.each { |child| find_test_steps(child, out) }

        [test_method, out]
      end
  end

  private def find_test_steps(ast, out = [], depth = 0)
    return out unless ast&.is_a?(Parser::AST::Node)

    if ast.type == :send
      add_node(ast, out, depth)
      ast.children.each { |child| find_test_steps(child, out, depth) }
    elsif ast.type == :block
      method, _args, child = ast.children

      children = child.type == :begin ? child.children : [child]

      if method.type == :send
        depth += 1 if add_node(method, out, depth)
        method.children.each { |child| find_test_steps(child, out, depth) }
      end

      children.each { |child| find_test_steps(child, out, depth) }
    end

    out
  end

  private def add_node(node, out, depth)
    unless Cyperful::TestParser.step_at_methods.include?(node.children[1])
      return false
    end

    out << {
      method: node.children[1],
      line: node.loc.line,
      column: node.loc.column,
      as_string: node.loc.expression.source,
      block_depth: depth,
    }

    true
  end
end
