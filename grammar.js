/**
 * @file Solidity grammar for tree-sitter
 * @author pyk <gm@pyk.sh>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/**
 * A constant object to define and manage operator precedence levels.
 *
 * This is a best practice for writing maintainable Tree-sitter grammars.
 * Instead of using "magic numbers" for precedence, we assign them to named
 * constants. This makes the grammar easier to read and modify. The values
 * determine the order of operations, with higher numbers binding more tightly.
 * For example, `UNARY` (13) has a higher precedence than `MULTIPLY` (11).
 *
 * This approach is used to resolve ambiguity in flat `choice` rules, a technique
 * recommended by the Tree-sitter documentation.
 */
const PREC = {
  ASSIGN: 0,
  CONDITIONAL: 1,
  OR: 2,
  AND: 3,
  BIT_OR: 4,
  BIT_XOR: 5,
  BIT_AND: 6,
  EQUALITY: 7,
  COMPARE: 8,
  SHIFT: 9,
  ADD: 10,
  MULTIPLY: 11,
  EXP: 12,
  UNARY: 13,
  POSTFIX: 14,
  MEMBER: 15,
  NEW: 16,
}

// Helper function for comma-separated lists
function commaSep(rule) {
  return seq(rule, repeat(seq(",", rule)))
}

module.exports = grammar({
  name: "solidity",

  // Add the `word` property here. This resolves conflicts between
  // keywords like "import" and the general identifier rule.
  word: ($) => $.identifier,

  extras: ($) => [/\s/, $.comment, $.natspec_comment],

  //
  conflicts: ($) => [],

  rules: {
    //############################################################//
    //                          Keywords                          //
    //############################################################//

    // Declaration: A declaration introduces a name and a type into a scope.
    // It tells the compiler, "This thing exists, and this is what it's
    // called and what type it is." It doesn't necessarily provide the full
    // implementation.
    //
    // Definition: A definition is a declaration that also provides the full
    // implementation or value. It tells the compiler,
    // "This is what this thing is."
    //
    // Directives: These are instructions for the compiler. They affect the
    // compilation process itself—how the code is treated, what other code is
    // included, or what compiler features are enabled. They don't typically
    // define runtime behavior or data structures that exist on the blockchain.

    //############################################################//
    //                        Source File                         //
    //############################################################//

    /**
     * The top-level rule, representing a complete Solidity source file.
     */
    source_file: ($) =>
      seq(
        optional(field("license", $.license)),
        repeat(
          choice(
            field("directive", $._top_level_directives),
            field("definition", $._top_level_definitions),
          ),
        ),
      ),

    _top_level_directives: ($) => choice($.pragma, $.import, $.using),

    _top_level_definitions: ($) =>
      choice(
        $.constant,
        $.contract,
        $.interface,
        $.library,
        $.struct,
        $.enum,
        $.event,
        $.error,
        $.function,
        $.udvt,
      ),

    //############################################################//
    //                          License                           //
    //############################################################//

    /**
     * The SPDX license identifier, which should appear at the top of a source file.
     * This rule captures the license string itself in a 'license' field.
     * e.g., `// SPDX-License-Identifier: MIT`
     */
    license: ($) =>
      seq(
        // By wrapping the regex in `token(prec(1, ...))` we tell the lexer:
        // "This specific pattern has higher priority than a generic comment."
        token(prec(1, /\/\/\s*SPDX-License-Identifier:/)),
        field("value", $.license_identifier),
      ),

    license_identifier: ($) => /[\w\.-]+/,

    //############################################################//
    //                           Pragma                           //
    //############################################################//

    /**
     * A pragma directive, used to enable certain compiler features or checks.
     * e.g., `pragma solidity 0.8.0;`
     * e.g., `pragma solidity ^0.8.0;`
     * e.g., `pragma solidity >=0.8.0 <0.9.0;`
     */
    pragma: ($) =>
      seq(
        "pragma",
        field("name", $.identifier),
        // Use `version` for the field name. Since it's a `repeat1`,
        // it will correctly capture one or more constraints.
        field("version", repeat1($.version_constraint)),
        ";",
      ),

    version_constraint: ($) =>
      seq(
        // Add fields for operator and literal
        optional(field("operator", $.version_operator)),
        field("number", $.version_literal), // Using 'number' is a good, specific choice
      ),

    version_operator: ($) => choice("^", "~", ">=", "<=", ">", "<", "="),

    version_literal: ($) => /\d+(\.\d+){0,2}/,

    //############################################################//
    //                           Import                           //
    //############################################################//

    import: ($) =>
      seq(
        "import",
        choice(
          // e.g., import "path/to/file.sol";
          // e.g., import "path/to/file.sol" as MyContract;
          seq(
            field("path", $.string_literal),
            optional(seq("as", field("alias", $.identifier))),
          ),
          // e.g., import {symbol1 as alias, symbol2} from "path/to/file.sol";
          seq(
            field("symbols", $.symbol_list),
            "from",
            field("path", $.string_literal),
          ),
          // e.g., import * as MyLib from "path/to/file.sol";
          seq(
            "*",
            "as",
            field("alias", $.identifier),
            "from",
            field("path", $.string_literal),
          ),
        ),
        ";",
      ),

    symbol_list: ($) => seq("{", commaSep($.symbol), "}"),

    symbol: ($) =>
      seq(
        field("name", $.identifier),
        optional(seq("as", field("alias", $.identifier))),
      ),

    //############################################################//
    //                           Using                            //
    //############################################################//

    using: ($) =>
      seq(
        "using",
        choice(
          field(
            "declaration",
            choice($.identifier_path, prec(1, $.identifier)),
          ),
          seq("{", commaSep(field("declaration", $.using_declaration)), "}"),
        ),
        "for",
        field("target", choice($.wildcard_type, $._type_name)),
        optional(field("global", $.global_using)),
        ";",
      ),

    using_declaration: ($) =>
      seq(
        field("name", $._using_function_path), // Use our precise path rule
        optional(seq("as", field("operator", $.user_definable_operator))),
      ),

    _using_function_path: ($) =>
      choice($.identifier, $.qualified_function_name),

    qualified_function_name: ($) =>
      seq(field("scope", $.identifier), ".", field("name", $.identifier)),

    // A named node for the `global` keyword
    global_using: ($) => "global",

    user_definable_operator: ($) =>
      choice(
        "&",
        "~",
        "|",
        "^",
        "+",
        "/",
        "%",
        "*",
        "-",
        "==",
        ">",
        ">=",
        "<",
        "<=",
        "!=",
      ),

    wildcard_type: ($) => "*",

    //************************************************************//
    //                          Comments                          //
    //************************************************************//

    // A regular, non-documentation comment
    comment: ($) =>
      token(
        choice(
          seq("//", /[^\r\n]*/),
          seq("/*", /[^*]*\*+([^/*][^*]*\*+)*/, "/"),
        ),
      ),

    // A NatSpec documentation comment
    natspec_comment: ($) =>
      token(
        choice(seq("///", /[^\r\n]*/), seq("/**", /([^*]|\*+[^/])*/, "*/")),
      ),

    //##########################################################//
    //                         Contract                         //
    //##########################################################//

    contract: ($) =>
      seq(
        optional("abstract"),
        "contract",
        field("name", $.identifier),
        optional(field("parents", $.parent_list)),
        "{", // The body starts here
        repeat(
          choice(
            field("storage", $.storage),
            field("function", $.function),
            field("modifier", $.modifier_definition),
            field("struct", $.struct),
            field("enum", $.enum),
            field("event", $.event),
            field("error", $.error),
            field("using", $.using),
            field("udvt", $.udvt),
            field("constructor", $.constructor),
            field("fallback", $.fallback_function_definition),
            field("receive", $.receive_function_definition),
          ),
        ),
        "}", // The body ends here
      ),

    parent_list: ($) => seq("is", commaSep($.parent)),
    parent: ($) =>
      seq(
        field("name", $.identifier_path),
        optional(field("arguments", $.call_argument_list)),
      ),

    //##########################################################//
    //                        Interface                         //
    //##########################################################//

    interface: ($) =>
      seq(
        "interface",
        field("name", $.identifier),
        optional(field("parents", $.parent_list)),
        "{", // The body starts here
        repeat(
          choice(
            // Interfaces can contain: functions (unimplemented), structs, enums, events, errors
            field("function", $.function),
            field("struct", $.struct),
            field("enum", $.enum),
            field("event", $.event),
            field("error", $.error),
            field("udvt", $.udvt),
          ),
        ),
        "}", // The body ends here
      ),

    //##########################################################//
    //                         Library                          //
    //##########################################################//

    library: ($) =>
      seq(
        "library",
        field("name", $.identifier),
        "{", // The body starts here
        repeat(
          choice(
            // Libraries can contain: functions, structs, enums, events, errors, using directives, state variables (constants only)
            field("function", $.function),
            field("struct", $.struct),
            field("enum", $.enum),
            field("event", $.event),
            field("error", $.error),
            field("using", $.using),
            field("storage", $.storage), // The parser doesn't enforce constant here; that's a job for a semantic checker or linter.
          ),
        ),
        "}", // The body ends here
      ),

    //############################################################//
    //                     Constant Variables                     //
    //############################################################//

    constant: ($) =>
      seq(
        field("type", $._type_name),
        "constant",
        field("name", $.identifier),
        "=",
        field("value", $._expression),
        ";",
      ),

    //############################################################//
    //                        Constructor                         //
    //############################################################//

    constructor: ($) =>
      seq(
        "constructor",
        "(",
        optional(field("parameters", $.parameter_list)),
        ")",
        repeat($._constructor_attribute),
        field("body", $.block),
      ),

    _constructor_attribute: ($) =>
      choice(
        field("visibility", $.visibility),
        field("mutability", $.state_mutability),
        // Use a different field name here to allow for multiple
        field("invocation", $.modifier_invocation),
      ),

    //##########################################################//
    //                          Others                          //
    //##########################################################//

    function: ($) =>
      seq(
        "function",
        field("name", $.identifier),
        "(",
        optional(field("parameters", $.parameter_list)),
        ")",
        repeat($._function_attribute),
        optional(
          seq(
            "returns",
            "(",
            optional(field("returns", $.parameter_list)),
            ")",
          ),
        ),
        choice(field("body", $.block), ";"),
      ),
    /**
     * An attribute of a function, such as visibility or state mutability.
     */
    _function_attribute: ($) =>
      choice(
        field("visibility", $.visibility),
        field("mutability", $.state_mutability),
        field("modifier", $.modifier_invocation),
        field("virtual", $.virtual),
        field("override", $.override_specifier), // <-- Added field name
      ),

    /**
     * A list of parameters, used for function arguments and return values.
     */
    parameter_list: ($) => commaSep($.parameter_declaration),

    /**
     * A block of statements enclosed in curly braces.
     */
    block: ($) => seq("{", repeat($._statement), "}"),

    struct: ($) =>
      seq(
        "struct",
        field("name", $.identifier),
        "{",
        repeat($.struct_member),
        "}",
      ),

    struct_member: ($) =>
      seq(field("type", $._type_name), field("name", $.identifier), ";"),

    enum: ($) =>
      seq(
        "enum",
        field("name", $.identifier),
        "{",
        // The commaSep helper handles one or more comma-separated values
        commaSep(field("value", $.identifier)),
        "}",
      ),

    _event_parameter: ($) =>
      choice($.indexed_event_parameter, $.unindexed_event_parameter),

    indexed_event_parameter: ($) =>
      seq(
        field("type", $._type_name),
        "indexed",
        optional(field("name", $.identifier)),
      ),

    unindexed_event_parameter: ($) =>
      seq(field("type", $._type_name), optional(field("name", $.identifier))),

    // New helper rules for event/error parameters
    event_parameter_list: ($) => commaSep($._event_parameter),
    error_parameter_list: ($) => commaSep($.error_parameter),

    // Updated event/error definitions
    event: ($) =>
      seq(
        "event",
        field("name", $.identifier),
        "(",
        optional(field("parameters", $.event_parameter_list)),
        ")",
        optional($.anonymous),
        ";",
      ),

    error: ($) =>
      seq(
        "error",
        field("name", $.identifier),
        "(",
        optional(field("parameters", $.error_parameter_list)),
        ")",
        ";",
      ),

    // Rule for the `anonymous` keyword
    anonymous: ($) => "anonymous",

    error_parameter: ($) =>
      seq(field("type", $._type_name), optional(field("name", $.identifier))),

    modifier_invocation: ($) =>
      seq(
        field("name", $.identifier_path),
        optional(field("arguments", $.call_argument_list)),
      ),

    _modifier_attribute: ($) =>
      choice(
        field("virtual", $.virtual),
        field("override", $.override_specifier),
      ),

    modifier_definition: ($) =>
      prec(
        1,
        seq(
          "modifier",
          field("name", $.identifier),
          "(",
          optional(field("parameters", $.parameter_list)),
          ")",
          repeat($._modifier_attribute),
          choice(field("body", $.block), ";"),
        ),
      ),

    // Add a helper rule for receive/fallback attributes
    _function_like_attribute: ($) =>
      choice(
        field("visibility", $.visibility),
        field("mutability", $.state_mutability),
        field("modifier", $.modifier_invocation),
        "virtual",
        // TODO: add override_specifier here later
      ),

    override_specifier: ($) =>
      seq(
        "override",
        optional(seq("(", commaSep(field("from", $.identifier_path)), ")")),
      ),

    // The receive function definition
    receive_function_definition: ($) =>
      seq(
        "receive",
        "(",
        ")",
        repeat($._function_like_attribute),
        choice(field("body", $.block), ";"),
      ),

    // The fallback function definition
    fallback_function_definition: ($) =>
      seq(
        "fallback",
        "(",
        optional(field("parameters", $.parameter_list)),
        ")",
        repeat($._function_like_attribute),
        optional(
          seq(
            "returns",
            "(",
            optional(field("returns", $.parameter_list)),
            ")",
          ),
        ),
        choice(field("body", $.block), ";"),
      ),

    udvt: ($) =>
      seq(
        "type",
        field("name", $.identifier),
        "is",
        field("underlying_type", $._elementary_type_name),
        ";",
      ),

    //************************************************************//
    //                        Declarations                        //
    //************************************************************//

    /**
     * A state variable declaration within a contract.
     * e.g., `uint256 public myVar = 1;`
     */
    storage: ($) =>
      seq(
        field("type", $._type_name),
        repeat($._state_variable_attribute),
        field("name", $.identifier),
        optional(seq("=", field("value", $._expression))),
        ";",
      ),

    /**
     * An attribute of a state variable, such as visibility or mutability.
     */
    _state_variable_attribute: ($) =>
      choice(
        field("visibility", $.visibility),
        field("mutability", $.mutability),
        field("override", $.override_specifier),
        field("transient", "transient"),
      ),

    /**
     * A single variable declaration, used in statements and tuples.
     * e.g., `uint256 myVar` or `string memory name`
     */
    variable_declaration: ($) =>
      seq(
        field("type", $._type_name),
        optional(field("location", $.data_location)),
        optional(field("name", $.identifier)),
      ),

    /**
     * A tuple of variable declarations. Can contain empty slots.
     * e.g., `(uint a, , uint c)`
     */
    variable_declaration_tuple: ($) =>
      // Give this rule a higher precedence than tuple_expression to resolve ambiguity.
      prec(1, seq("(", commaSep(optional($.variable_declaration)), ")")),

    /**
     * A single parameter declaration.
     * e.g., `uint256 _myVar` or `string memory _name`
     */
    parameter_declaration: ($) =>
      seq(
        field("type", $._type_name),
        optional(field("location", $.data_location)),
        optional(field("name", $.identifier)),
      ),

    //************************************************************//
    //                         Statements                         //
    //************************************************************//

    /**
     * A placeholder for any statement.
     */
    _statement: ($) =>
      choice(
        $.block,
        $.variable_declaration_statement,
        $.expression_statement,
        $.return_statement,
        $.if_statement,
        $.for_statement,
        $.emit_statement,
        $.while_statement,
        $.do_while_statement,
        $.continue_statement,
        $.placeholder_statement,
        $.break_statement,
        $.revert_statement,
      ),

    /**
     * An expression statement, which is an expression followed by a semicolon.
     * e.g., `x = 1;` or `foo();`
     */
    expression_statement: ($) => seq($._expression, ";"),

    /**
     * A local variable declaration statement.
     * e.g., `uint i = 0;` or `(a,b) = (1,2);`
     */
    variable_declaration_statement: ($) =>
      seq(
        choice(
          // For single variable declarations, e.g., `uint myVar = 1;`
          seq(
            // We are adding the `field()` wrapper here
            field("declaration", $.variable_declaration),
            optional(seq("=", field("value", $._expression))),
          ),
          // For tuple declarations, e.g., `(uint a, bool b) = (1, true);`
          seq(
            // We also add the `field()` wrapper here for consistency
            field("declaration", $.variable_declaration_tuple),
            "=",
            field("value", $._expression),
          ),
        ),
        ";",
      ),

    /**
     * A return statement.
     * e.g., `return;` or `return myValue;`
     */
    return_statement: ($) =>
      seq("return", optional(field("value", $._expression)), ";"),

    /**
     * An if statement, with an optional else branch.
     * e.g., `if (condition) { ... } else { ... }`
     */
    if_statement: ($) =>
      prec.right(
        choice(
          // if-else statement
          seq(
            "if",
            "(",
            field("condition", $._expression),
            ")",
            field("consequence", $._statement),
            "else",
            field("alternative", $._statement),
          ),
          // if statement without else
          seq(
            "if",
            "(",
            field("condition", $._expression),
            ")",
            field("consequence", $._statement),
          ),
        ),
      ),

    /**
     * A for loop.
     * e.g., `for (uint i = 0; i < 10; i++) { ... }`
     */
    /**
     * A for loop.
     * e.g., `for (uint i = 0; i < 10; i++) { ... }`
     */
    for_statement: ($) =>
      seq(
        "for",
        "(",
        // This part correctly handles the three cases for the initializer
        // and consumes the first semicolon.
        field(
          "initializer",
          choice($.variable_declaration_statement, $.expression_statement, ";"),
        ),

        // The condition is an optional expression, followed by a mandatory semicolon.
        field("condition", optional($._expression)),
        ";",

        // The update is an optional expression.
        field("update", optional($._expression)),

        ")",
        field("body", $._statement),
      ),

    /**
     * An emit statement.
     * e.g., `emit MyEvent(arg1, arg2);`
     */
    emit_statement: ($) => seq("emit", $.call_expression, ";"),

    while_statement: ($) =>
      seq(
        "while",
        "(",
        field("condition", $._expression),
        ")",
        field("body", $._statement),
      ),

    do_while_statement: ($) =>
      seq(
        "do",
        field("body", $._statement),
        "while",
        "(",
        field("condition", $._expression),
        ")",
        ";",
      ),
    continue_statement: ($) => seq("continue", ";"),

    placeholder_statement: ($) => prec(1, seq("_", ";")),

    break_statement: ($) => seq("break", ";"),

    revert_statement: ($) =>
      prec(
        1,
        seq(
          "revert",
          // We can also be more specific about what an error can be
          field("error", $.identifier_path),
          field("arguments", $.call_argument_list),
          ";",
        ),
      ),

    //************************************************************//
    //                      Expression Rules                      //
    //************************************************************//

    // _expression
    // ├── primary_expression
    // │   ├── literal
    // │   │   ├── number_literal
    // │   │   ├── string_literal
    // │   │   ├── boolean_literal
    // │   │   └── hex_literal
    // │   └── identifier
    // ├── additive_expression
    // │   ├── left: _expression
    // │   ├── operator: additive_operator
    // │   └── right: _expression
    // ├── multiplicative_expression
    // │   ├── left: _expression
    // │   ├── operator: multiplicative_operator
    // │   └── right: _expression
    // ├── assignment_expression
    // │   ├── left: _expression
    // │   ├── operator: assignment_operator
    // │   └── right: _expression
    // └── tuple_expression
    //     └── _expression (repeated)

    /**
     * The main, hidden expression rule.
     * As a hidden rule, it doesn't appear in the AST. Instead, its chosen
     * child (e.g., additive_expression) is hoisted into its place.
     */
    _expression: ($) =>
      choice(
        $.primary_expression,
        $.unary_expression,
        $.conditional_expression,
        $.payable_conversion_expression,
        $.meta_type_expression,
        $.call_expression,
        $.member_access_expression,
        $.index_access_expression,
        $.index_range_access_expression,
        $.new_expression,
        $.assignment_expression,
        $.additive_expression,
        $.multiplicative_expression,
        $.exponentiation_expression,
        $.shift_expression,
        $.tuple_expression,
        $.bitwise_and_expression,
        $.bitwise_xor_expression,
        $.bitwise_or_expression,
        $.comparison_expression,
        $.equality_expression,
        $.logical_and_expression,
        $.logical_or_expression,
        $.inline_array_expression,
      ),

    /**
     * Primary expressions are the leaf nodes of the expression tree.
     */
    primary_expression: ($) =>
      choice($.literal, $.literal_with_subdenomination, prec(1, $.identifier)),

    literal_with_subdenomination: ($) =>
      seq($.number_literal, $.subdenomination),

    subdenomination: ($) =>
      choice("wei", "gwei", "ether", "seconds", "minutes", "hours", "days"),

    /**
     * A unary expression, handling both prefix and suffix operators.
     * The `prec.right` and `prec.left` functions assign both a precedence
     * level and an associativity (left or right).
     *
     * We give these a high precedence to ensure they bind correctly. For
     * example, `-a * b` should be parsed as `(-a) * b`, not `-(a * b)`.
     */
    unary_expression: ($) =>
      choice(
        // Prefix operators (e.g., `!a`, `-a`, `++a`) are right-associative.
        prec.right(
          PREC.UNARY,
          seq(
            field("operator", choice("!", "~", "-", "delete")),
            field("argument", $._expression),
          ),
        ),
        prec.right(
          PREC.UNARY,
          seq(
            field("operator", choice("++", "--")),
            field("argument", $._expression),
          ),
        ),
        // Suffix operators (e.g., `a++`) are left-associative.
        prec.left(
          PREC.POSTFIX,
          seq(
            field("argument", $._expression),
            field("operator", choice("++", "--")),
          ),
        ),
      ),

    /**
     * A conditional (ternary) expression. e.g., `a ? b : c`
     *
     * This rule is defined with right-associativity to handle nested
     * conditionals correctly. For example, `a ? b : c ? d : e` is parsed
     * as `a ? b : (c ? d : e)`. This is a standard behavior for ternary
     * operators in C-like languages.
     *
     * We assign it a low precedence (`CONDITIONAL`) to ensure that it doesn't
     * incorrectly bind with higher-precedence binary operators.
     *
     * The `field()` function is used to label the parts of the expression,
     * making the resulting syntax tree easy to query and analyze.
     */
    conditional_expression: ($) =>
      prec.right(
        PREC.CONDITIONAL,
        seq(
          field("condition", $._expression),
          "?",
          field("consequence", $._expression),
          ":",
          field("alternative", $._expression),
        ),
      ),

    /**
     * An argument list for a function call.
     * e.g., `(arg1, arg2)` or `()`
     */
    call_argument_list: ($) =>
      prec(
        1, // Add precedence here to resolve ambiguity
        seq(
          "(",
          // Make the comma-separated list of expressions optional
          // to correctly handle calls with no arguments.
          optional(commaSep($._expression)),
          ")",
        ),
      ),

    /**
     * The options block for a function call.
     * e.g., `{value: 1, gas: 10000}`
     */
    call_options_block: ($) => seq("{", commaSep($.named_argument), "}"),

    /**
     * An argument in a function call options block.
     * e.g., `value: 1 ether` or `gas: 10000`
     */
    named_argument: ($) =>
      seq(field("name", $.identifier), ":", field("value", $._expression)),

    /**
     * A function call expression, with optional call options.
     * e.g., `myFunction(arg1, arg2)` or `myFunc{value: 1 ether}()`
     */
    call_expression: ($) =>
      prec(
        PREC.MEMBER,
        seq(
          field("function", $._expression),
          optional(field("options", $.call_options_block)),
          field("arguments", $.call_argument_list),
        ),
      ),

    /**
     * A member access expression.
     * e.g., `myVariable.property`
     *
     * This rule is made left-associative using `prec.left` to ensure that
     * chained member access is parsed correctly. For example, an expression
     * like `a.b.c` is grouped from left to right as `(a.b).c`.
     *
     * It shares the same high precedence level as `call_expression` (`PREC.MEMBER`)
     * to correctly handle interactions between them, such as accessing a property
     * on the result of a function call: `myFunc().property`.
     */
    member_access_expression: ($) =>
      prec.left(
        PREC.MEMBER,
        seq(field("object", $._expression), ".", field("member", $.identifier)),
      ),

    /**
     * An index access expression.
     * e.g., `myArray[i]`
     *
     * This rule is left-associative and shares the same high precedence as
     * member access and function calls to allow for correct chaining,
     * such as `myArray[i][j]` or `myFunc()[i]`.
     */
    index_access_expression: ($) =>
      prec.left(
        PREC.MEMBER,
        seq(
          field("base", $._expression),
          "[",
          field("index", $._expression),
          "]",
        ),
      ),

    index_range_access_expression: ($) =>
      prec.left(
        PREC.MEMBER,
        seq(
          field("base", $._expression),
          "[",
          optional(field("start", $._expression)),
          ":",
          optional(field("end", $._expression)),
          "]",
        ),
      ),

    /**
     * A `new` expression for contract creation.
     * e.g., `new MyContract()` or `new MyLib.MyContract()`
     *
     * This rule is given a very high, right-associative precedence (`PREC.NEW`)
     * to resolve the ambiguity with member access. This ensures that
     * `new MyLib.MyContract` is parsed as one unit before the parser
     * attempts to find a member access.
     */
    new_expression: ($) =>
      prec.right(PREC.NEW, seq("new", field("type", $._type_name))),

    /**
     * Specific expression types for different operator precedence levels.
     * This makes the AST much more descriptive.
     */
    additive_expression: ($) =>
      prec.left(
        PREC.ADD,
        seq(
          field("left", $._expression),
          field("operator", $.additive_operator),
          field("right", $._expression),
        ),
      ),

    multiplicative_expression: ($) =>
      prec.left(
        PREC.MULTIPLY,
        seq(
          field("left", $._expression),
          field("operator", $.multiplicative_operator),
          field("right", $._expression),
        ),
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGN,
        seq(
          field("left", $._expression),
          field(
            "operator",
            choice(
              $.simple_assignment_operator,
              $.compound_assignment_operator,
            ),
          ),
          field("right", $._expression),
        ),
      ),

    exponentiation_expression: ($) =>
      prec.right(
        PREC.EXP,
        seq(
          field("left", $._expression),
          field("operator", "**"),
          field("right", $._expression),
        ),
      ),

    shift_expression: ($) =>
      prec.left(
        PREC.SHIFT,
        seq(
          field("left", $._expression),
          field("operator", $.shift_operator),
          field("right", $._expression),
        ),
      ),

    bitwise_and_expression: ($) =>
      prec.left(
        PREC.BIT_AND,
        seq(
          field("left", $._expression),
          field("operator", "&"),
          field("right", $._expression),
        ),
      ),

    bitwise_xor_expression: ($) =>
      prec.left(
        PREC.BIT_XOR,
        seq(
          field("left", $._expression),
          field("operator", "^"),
          field("right", $._expression),
        ),
      ),

    bitwise_or_expression: ($) =>
      prec.left(
        PREC.BIT_OR,
        seq(
          field("left", $._expression),
          field("operator", "|"),
          field("right", $._expression),
        ),
      ),

    comparison_expression: ($) =>
      prec.left(
        PREC.COMPARE,
        seq(
          field("left", $._expression),
          field("operator", $.comparison_operator),
          field("right", $._expression),
        ),
      ),

    equality_expression: ($) =>
      prec.left(
        PREC.EQUALITY,
        seq(
          field("left", $._expression),
          field("operator", $.equality_operator),
          field("right", $._expression),
        ),
      ),

    logical_and_expression: ($) =>
      prec.left(
        PREC.AND,
        seq(
          field("left", $._expression),
          field("operator", "&&"),
          field("right", $._expression),
        ),
      ),

    logical_or_expression: ($) =>
      prec.left(
        PREC.OR,
        seq(
          field("left", $._expression),
          field("operator", "||"),
          field("right", $._expression),
        ),
      ),

    /**
     * Named operator rules. Because these are named, they will appear
     * in the final syntax tree.
     */
    additive_operator: ($) => choice("+", "-"),
    multiplicative_operator: ($) => choice("*", "/", "%"),
    shift_operator: ($) => choice("<<", ">>", ">>>"),

    /**
     * The simple assignment operator.
     */
    simple_assignment_operator: ($) => "=",

    /**
     * A compound assignment operator.
     * e.g., `+=`, `*=`
     */
    compound_assignment_operator: ($) =>
      choice("|=", "^=", "&=", "<<=", ">>=", "+=", "-=", "*=", "/=", "%="),

    comparison_operator: ($) => choice("<", ">", "<=", ">="),
    equality_operator: ($) => choice("==", "!="),

    /**
     * A tuple expression.
     * e.g., `(1, true)` or `(a, b)`
     */
    tuple_expression: ($) => seq("(", optional(commaSep($._expression)), ")"),

    /**
     * A `payable` conversion expression.
     * e.g., `payable(myAddress)`
     */
    payable_conversion_expression: ($) =>
      prec(
        1, // Give it a lower precedence than address_type
        seq("payable", field("arguments", $.call_argument_list)),
      ),

    /**
     * A `type` expression for retrieving type information.
     * e.g., `type(MyContract)`
     */
    meta_type_expression: ($) =>
      prec(PREC.MEMBER, seq("type", "(", field("type", $._type_name), ")")),

    /**
     * An inline array expression.
     * e.g., `[1, 2, 3]` or `[]`
     */
    inline_array_expression: ($) =>
      seq("[", optional(commaSep($._expression)), "]"),

    //************************************************************//
    //                           Types                            //
    //************************************************************//

    /**
     * An unsigned integer type.
     * Uses a token to ensure 'uint256' is not mistaken for an identifier.
     */
    uint_type: ($) =>
      token(
        /uint(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?/,
      ),

    /**
     * A signed integer type.
     */
    int_type: ($) =>
      token(
        /int(8|16|24|32|40|48|56|64|72|80|88|96|104|112|120|128|136|144|152|160|168|176|184|192|200|208|216|224|232|240|248|256)?/,
      ),

    /**
     * A fixed-size bytes type.
     */
    bytes_type: ($) =>
      token(
        /bytes(1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|22|23|24|25|26|27|28|29|30|31|32)?/,
      ),

    /**
     * A boolean type.
     */
    bool_type: ($) => "bool",

    /**
     * A string type.
     */
    string_type: ($) => "string",

    /**
     * An array type.
     * e.g., `uint[]`, `MyStruct[][]`
     */
    array_type: ($) =>
      seq(
        field("base", $._type_name),
        "[",
        optional(field("size", $._expression)), // <-- Add field("size", ...)
        "]",
      ),

    /**
     * An address type, which can be payable.
     */
    address_type: ($) =>
      prec.right(
        2, // Give it a precedence level of 2
        seq("address", optional(field("mutability", "payable"))),
      ),

    user_defined_type: ($) =>
      seq(field("name", choice($.identifier, $.identifier_path))),

    /**
     * A hidden rule for all elementary types.
     */
    _elementary_type_name: ($) =>
      choice(
        $.address_type,
        $.uint_type,
        $.int_type,
        $.bytes_type,
        $.bool_type,
      ),

    /**
     * A hidden rule for any type name.
     */
    _type_name: ($) =>
      choice(
        $.string_type,
        $._elementary_type_name,
        prec(-1, $.user_defined_type),
        $.array_type,
      ),

    //************************************************************//
    //                       Common Rules                         //
    //************************************************************//

    // This tells the parser: "When you are building an identifier_path and you have a choice
    // between finishing the rule (reducing) or consuming another token to make it longer
    // (shifting), always choose to shift.
    identifier_path: ($) =>
      prec.right(-1, seq($.identifier, repeat(seq(".", $.identifier)))),

    visibility: ($) => choice("public", "private", "internal", "external"),
    mutability: ($) => choice("constant", "immutable"),
    state_mutability: ($) => choice("pure", "view", "payable", "nonpayable"),
    data_location: ($) => choice("memory", "storage", "calldata"),

    /**
     * A literal value, such as a number, string, boolean, or address.
     */
    literal: ($) =>
      choice(
        $.number_literal,
        $.string_literal,
        $.boolean_literal,
        $.hex_literal,
        $.hex_string_literal,
        $.unicode_string_literal,
      ),

    boolean_literal: ($) => choice("true", "false"),
    hex_literal: ($) => /0x[0-9a-fA-F]+/,
    hex_string_literal: ($) =>
      token(seq("hex", /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/)),
    unicode_string_literal: ($) =>
      token(seq("unicode", /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/)),
    number_literal: ($) => /\d+/,
    string_literal: ($) => /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,
    identifier: ($) => /[a-zA-Z_]\w*/,
    virtual: ($) => "virtual",
  },
})
