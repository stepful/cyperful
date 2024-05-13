require "parser/current" # TODO: switch to Prism?

class Cyperful::TestParser
  # see docs for methods: https://www.rubydoc.info/github/jnicklas/capybara/Capybara/Session
  @step_at_methods =
    Capybara::Session::DSL_METHODS -
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
        title
        query
      ]

  def self.step_at_methods_set
    @step_at_methods_set ||= @step_at_methods.to_set
  end
  def self.add_step_at_methods(*mods_or_methods)
    mods_or_methods.flatten.each do |mod_or_method|
      case mod_or_method
      when Module
        @step_at_methods +=
          mod_or_method.methods(false) + mod_or_method.instance_methods(false)
      when String, Symbol
        @step_at_methods << mod_or_method.to_sym
      else
        raise "Expected Module or string/symbol, got: #{mod_or_method.class.name}"
      end
    end
  end

  def initialize(test_class)
    @test_class = test_class

    @source_filepath =
      if rspec?
        test_class.metadata.fetch(:absolute_file_path)
      else
        Object.const_source_location(test_class.name).first
      end
  end

  private def rspec?
    !!defined?(RSpec) && @test_class < RSpec::Core::ExampleGroup
  end

  def steps_per_test
    rspec? ? rspec_steps_per_test : minitest_steps_per_test
  end

  private def rspec_steps_per_test
    ast = Parser::CurrentRuby.parse(File.read(@source_filepath))

    example_per_line =
      @test_class.examples.to_h do |example|
        # file_path = example.metadata.fetch(:absolute_file_path)
        [example.metadata.fetch(:line_number) || -1, example]
      end

    example_asts =
      search_nodes(ast) do |node|
        next nil unless node.type == :block

        # assumption: the block is on the same line as the example, and there's at most one example per line
        example = example_per_line[node.loc.begin.line]
        next nil unless example

        # "#{@test_class.name} #{example.description} #{}"

        [example, node]
      end

    example_asts.to_h do |(example, block_node)|
      out = []
      block_node.children.each { |child| find_test_steps(child, out) }

      # de-duplicate steps by line number
      # TODO: support multiple steps on the same line. `step_per_line = ...` needs to be refactored
      out = out.reverse.uniq { |step| step[:line] }.reverse

      [example.full_description.to_sym, out]
    end
  end

  private def search_nodes(parent, out = [], &block)
    parent.children.each do |node|
      next unless node.is_a?(Parser::AST::Node)
      if (ret = block.call(node))
        #
        out << ret
      else
        search_nodes(node, out, &block)
      end
    end
    out
  end

  private def minitest_steps_per_test
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
      raise "Could not find class #{@test_class.name} in #{@source_filepath}"
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
          test_name = :"test_#{test_string.gsub(/\s+/, "_")}"

          block_node = node.children[2]
          [test_name, block_node]

          # e.g. `def test_my_test; ... end`
        elsif node.type == :def && node.children[0].to_s.start_with?("test_")
          test_name = node.children[0]

          block_node = node.children[2]
          [test_name, block_node]
        end
      end
      .compact
      .to_h do |test_name, block_node|
        out = []
        block_node.children.each { |child| find_test_steps(child, out) }

        # de-duplicate steps by line number
        # TODO: support multiple steps on the same line. `step_per_line = ...` needs to be refactored
        out = out.reverse.uniq { |step| step[:line] }.reverse

        [test_name, out]
      end
  end

  private def find_test_steps(ast, out = [], depth = 0)
    return out unless ast&.is_a?(Parser::AST::Node)

    if ast.type == :send
      # e.g. `assert_equal current_path, "/"` should be a single step, not 2
      unless add_node(ast, out, depth)
        ast.children.each { |child| find_test_steps(child, out, depth) }
      end
    elsif ast.type == :block
      method, _args, child = ast.children

      children = child.type == :begin ? child.children : [child]

      if method.type == :send
        depth += 1 if add_node(method, out, depth)

        method.children.each { |child| find_test_steps(child, out, depth) }
      end

      children.each { |child| find_test_steps(child, out, depth) }
    elsif ast.type == :begin
      ast.children.each { |child| find_test_steps(child, out, depth) }
    end

    out
  end

  private def add_node(node, out, depth)
    unless Cyperful::TestParser.step_at_methods_set.include?(node.children[1])
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
