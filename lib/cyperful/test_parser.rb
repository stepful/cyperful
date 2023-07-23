require "parser/current"

class Cyperful::TestParser
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
        [
          test_method,
          find_test_steps(block_node)
            # sanity check:
            .uniq { |step| step[:line] },
        ]
      end
  end

  private def find_test_steps(ast, out = [])
    return out unless ast&.is_a?(Parser::AST::Node)

    if ast.type == :send && Cyperful.step_at_methods.include?(ast.children[1])
      out << {
        method: ast.children[1],
        line: ast.loc.line,
        column: ast.loc.column,
        as_string: ast.loc.expression.source,
      }
    end

    ast.children.each { |child| find_test_steps(child, out) }

    out
  end
end
