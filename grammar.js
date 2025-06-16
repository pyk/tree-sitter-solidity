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
  CALL: 14,
  NEW: 15,
  POSTFIX: 16,
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

  // Whitespace is an extra, but comments are not, so they become visible nodes.
  extras: ($) => [/\s/],

  //
  conflicts: ($) => [],

  rules: {
    // source_file
    // └─── repeats 0 or more times...
    //      └─── _top_level_element
    //           ├─── spdx_license_identifier  (e.g., // SPDX-License-Identifier: MIT)
    //           ├─── pragma_directive         (e.g., pragma solidity ^0.8.0;)
    //           ├─── import_directive         (e.g., import "./MyFile.sol";)
    //           ├─── contract_definition      (e.g., contract C { ... })
    //           └─── interface_definition     (e.g., interface I { ... })

    /**
     * The top-level rule, representing a complete Solidity source file.
     * It consists of a sequence of top-level declarations and directives.
     *
     */
    source_file: ($) =>
      repeat(choice($._top_level_element, $.comment, $.natspec_comment)),

    /**
     * A choice between any of the valid top-level elements in a Solidity file.
     * This is a "hidden" rule (by convention, prefixed with `_`) that helps to
     * avoid unnecessary nesting in the final syntax tree.
     * The `choice` function allows any of the listed rules to be matched here.
     */
    _top_level_element: ($) =>
      choice(
        $.spdx_license_identifier,
        $.pragma_directive,
        $.import_directive,
        $.contract_definition,
        $.interface_definition,
        $.state_variable_declaration,
        // $.using_directive,
        // $.library_definition,
        // $.function_definition,
        // $.constant_variable_declaration,
        // $.struct_definition,
        // $.enum_definition,
        // $.user_defined_value_type_definition,
        // $.error_definition,
        // $.event_definition,
      ),

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

    //************************************************************//
    //                       SPDX License                         //
    //************************************************************//

    /**
     * The SPDX license identifier, which should appear at the top of a source file.
     * This rule captures the license string itself in a 'license' field.
     * e.g., `// SPDX-License-Identifier: MIT`
     */
    spdx_license_identifier: ($) =>
      seq(
        // By wrapping the regex in `token(prec(1, ...))` we tell the lexer:
        // "This specific pattern has higher priority than a generic comment."
        token(prec(1, /\/\/\s*SPDX-License-Identifier:/)),
        field("license", $.license_identifier),
      ),

    // Re-add the license_identifier rule so it can be inlined
    license_identifier: ($) => /[\w\.-]+/,

    //************************************************************//
    //                      Pragma Directive                      //
    //************************************************************//

    /**
     * A pragma directive, used to enable certain compiler features or checks.
     * e.g., `pragma solidity ^0.8.0;`
     * e.g., `pragma solidity >=0.8.0 <0.9.0;`
     */
    pragma_directive: ($) =>
      seq(
        "pragma",
        field("name", $.identifier),
        field("value", $._pragma_expression),
        ";",
      ),

    // A pragma expression consists of one or more version constraints.
    _pragma_expression: ($) => repeat1($.version_constraint),

    /**
     * A version constraint, such as `^0.8.0` or `>=0.8.0 <0.9.0`.
     * This is now a visible node in the syntax tree.
     */
    version_constraint: ($) =>
      seq(optional($.version_operator), $.version_literal),

    // An operator used for version constraints (hidden helper rule).
    version_operator: ($) => choice("^", "~", ">=", "<=", ">", "<", "="),

    // A semantic version number (visible node).
    version_literal: ($) => /\d+(\.\d+){0,2}/,

    //************************************************************//
    //                      Import Directive                      //
    //************************************************************//

    /**
     * An import directive, used to import symbols from another file.
     */
    import_directive: ($) =>
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
            field("symbols", $.symbol_aliases),
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

    /**
     * A set of symbol aliases in an import statement.
     * e.g., `{symbol1 as alias, symbol2}`
     */
    symbol_aliases: ($) => seq("{", commaSep($.import_alias), "}"),

    /**
     * A single symbol alias in an import statement.
     * e.g., `MySymbol as MyAlias` or just `MySymbol`
     */
    import_alias: ($) =>
      seq(
        field("symbol", $.identifier),
        optional(seq("as", field("alias", $.identifier))),
      ),

    //************************************************************//
    //                    Contract Definition                     //
    //************************************************************//

    // contract_definition
    // ├─ "abstract" (optional keyword)
    // ├─ "contract" (keyword)
    // ├─ name: identifier (e.g., MyContract)
    // └─ inheritance_specifier_list (optional)
    //    ├─ "is" (keyword)
    //    └─ inheritance_specifier (repeated, comma-separated)
    //       ├─ name: (This is the crucial part)
    //       │  ├─ choice 1: identifier. Matches simple names like `Ownable`.
    //       │  └─ choice 2: member_access_expression. Matches dotted paths like `Parent.DeepParent`.
    //       └─ arguments: call_argument_list. Matches constructor args like `("MyToken", "MTK")`

    /**
     * The definition of a contract.
     * e.g., `contract MyContract is Ownable { ... }`
     */
    contract_definition: ($) =>
      seq(
        optional("abstract"),
        "contract",
        field("name", $.identifier),
        optional($.inheritance_specifier_list),
        field("body", $.contract_body),
      ),

    /**
     * The body of a contract, enclosed in curly braces.
     */
    contract_body: ($) =>
      seq(
        "{",
        repeat(choice($._contract_body_element, $.comment, $.natspec_comment)),
        "}",
      ),

    /**
     * A choice between all valid elements within a contract body.
     * (Currently empty, to be filled in later).
     */
    _contract_body_element: ($) =>
      choice($.state_variable_declaration, $.function_definition),
    // TODO: Add function_definition, state_variable_declaration, etc.

    /**
     * The list of parent contracts in an inheritance clause.
     * e.g., `is Ownable, ReentrancyGuard`
     */
    inheritance_specifier_list: ($) =>
      seq("is", commaSep($.inheritance_specifier)),

    /**
     * A single parent contract in an inheritance list.
     * e.g., `Ownable` or `ERC20("MyToken", "MTK")`
     */
    inheritance_specifier: ($) =>
      prec(
        2, // <-- Give this rule a higher precedence
        seq(
          field("name", $.identifier_path),
          optional(field("arguments", $.call_argument_list)),
        ),
      ),

    //************************************************************//
    //                   Interface Definition                     //
    //************************************************************//

    /**
     * The definition of an interface.
     * e.g., `interface IMyContract { ... }`
     */
    interface_definition: ($) =>
      seq(
        "interface",
        field("name", $.identifier),
        optional($.inheritance_specifier_list),
        field("body", $.contract_body),
      ),

    //************************************************************//
    //                 State Variable Declaration                 //
    //************************************************************//

    /**
     * A state variable declaration within a contract.
     * e.g., `uint256 public myVar = 1;`
     */
    state_variable_declaration: ($) =>
      seq(
        field("type", $.type_name),
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
        $.visibility,
        $.mutability,
        // $.override_specifier, // To be added later
        "transient",
      ),

    //************************************************************//
    //                    Function Definition                     //
    //************************************************************//

    // function_definition
    // ├── "function" (keyword)
    // ├── name: identifier
    // ├── parameters: parameter_list
    // │   └── (
    // │       └── parameter_declaration (repeated)
    // │           ├── type: type_name
    // │           ├── data_location (optional)
    // │           └── name: identifier (optional)
    // │
    // ├── _function_attribute (repeated)
    // │   ├── visibility
    // │   ├── state_mutability
    // │   └── "virtual"
    // │
    // ├── returns_clause (optional)
    // │   └── returns: parameter_list
    // │
    // └── body:
    //     ├── block (e.g. { ... })
    //     └── empty_body (e.g. ;)

    /**
     * The definition of a function.
     * e.g., `function myFunc(uint256 _a) public pure returns (bool) { ... }`
     */
    function_definition: ($) =>
      seq(
        "function",
        field("name", $.identifier),
        field("parameters", $.parameter_list),
        repeat($._function_attribute),
        optional($.returns_clause),
        field("body", choice($.block, $.empty_body)),
      ),

    /**
     * An attribute of a function, such as visibility or state mutability.
     */
    _function_attribute: ($) =>
      choice(
        $.visibility,
        $.state_mutability,
        "virtual",
        // $.override_specifier, // To be added later
        // $.modifier_invocation // To be added later
      ),

    /**
     * The `returns` clause of a function.
     * e.g., `returns (bool)`
     */
    returns_clause: ($) => seq("returns", field("returns", $.parameter_list)),

    /**
     * A list of parameters, used for function arguments and return values.
     * e.g., `(uint256 _a, bool _b)`
     */
    parameter_list: ($) =>
      seq("(", optional(commaSep($.parameter_declaration)), ")"),

    /**
     * A single parameter declaration.
     * e.g., `uint256 _myVar` or `string memory _name`
     */
    parameter_declaration: ($) =>
      seq(
        field("type", $.type_name),
        optional($.data_location),
        optional(field("name", $.identifier)),
      ),

    /**
     * A block of statements enclosed in curly braces.
     */
    block: ($) =>
      seq("{", repeat(choice($._statement, $.comment, $.natspec_comment)), "}"),

    /**
     * A new named rule for a function body that is just a semicolon.
     */
    empty_body: ($) => ";",

    /**
     * A placeholder for any statement.
     */
    _statement: ($) =>
      choice($.variable_declaration_statement, $.expression_statement),
    // TODO: Add statements like if, for, require, etc.

    //************************************************************//
    //                      Statement Rules                       //
    //************************************************************//

    /**
     * An expression statement, which is an expression followed by a semicolon.
     * e.g., `x = 1;` or `foo();`
     */
    expression_statement: ($) => seq($._expression, ";"),

    //************************************************************//
    //              Variable Declaration Statement                //
    //************************************************************//

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
     * A single variable declaration, used in statements and tuples.
     * e.g., `uint256 myVar` or `string memory name`
     */
    variable_declaration: ($) =>
      seq(
        field("type", $.type_name),
        optional($.data_location),
        optional(field("name", $.identifier)),
      ),

    /**
     * A tuple of variable declarations. Can contain empty slots.
     * e.g., `(uint a, , uint c)`
     */
    variable_declaration_tuple: ($) =>
      // Give this rule a higher precedence than tuple_expression to resolve ambiguity.
      prec(1, seq("(", commaSep(optional($.variable_declaration)), ")")),

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
        $.call_expression,
        $.member_access_expression,
        $.index_access_expression,
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
      ),

    /**
     * Primary expressions are the leaf nodes of the expression tree.
     */
    primary_expression: ($) => choice($.literal, prec(1, $.identifier)),

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
      seq(
        "(",
        // Make the comma-separated list of expressions optional
        // to correctly handle calls with no arguments.
        optional(commaSep($._expression)),
        ")",
      ),

    /**
     * A function call expression.
     * e.g., `myFunction(arg1, arg2)`
     *
     * It has a high precedence to ensure that member access on a call's
     * result (e.g., `myFunc().property`) is parsed correctly.
     */
    call_expression: ($) =>
      prec(
        PREC.CALL,
        seq(
          field("function", $._expression),
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
     * It shares the same high precedence level as `call_expression` (`PREC.CALL`)
     * to correctly handle interactions between them, such as accessing a property
     * on the result of a function call: `myFunc().property`.
     */
    member_access_expression: ($) =>
      prec.left(
        PREC.CALL,
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
        PREC.CALL,
        seq(
          field("base", $._expression),
          "[",
          field("index", $._expression),
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
      prec.right(PREC.NEW, seq("new", field("type", $.type_name))),

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
          field("operator", $.assignment_operator),
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

    /**
     * Named operator rules. Because these are named, they will appear
     * in the final syntax tree.
     */
    additive_operator: ($) => choice("+", "-"),
    multiplicative_operator: ($) => choice("*", "/", "%"),
    shift_operator: ($) => choice("<<", ">>", ">>>"),
    assignment_operator: ($) => choice("="),
    comparison_operator: ($) => choice("<", ">", "<=", ">="),
    equality_operator: ($) => choice("==", "!="),

    /**
     * A tuple expression.
     * e.g., `(1, true)` or `(a, b)`
     */
    tuple_expression: ($) => seq("(", optional(commaSep($._expression)), ")"),

    //************************************************************//
    //                       Common Rules                         //
    //************************************************************//

    /**
     * A type name for a variable, parameter, or return value.
     * This is now a recursive rule to handle array types.
     */
    type_name: ($) =>
      choice($.elementary_type_name, $.identifier_path, $.array_type),

    // This tells the parser: "When you are building an identifier_path and you have a choice
    // between finishing the rule (reducing) or consuming another token to make it longer
    // (shifting), always choose to shift.
    identifier_path: ($) =>
      prec.right(-1, seq($.identifier, repeat(seq(".", $.identifier)))),

    /**
     * An array type.
     * e.g., `uint[]`, `MyStruct[][]`
     */
    array_type: ($) =>
      seq(
        field("base", $.type_name),
        "[",
        // Allow an optional expression for fixed-size arrays (e.g., uint[3]).
        optional($._expression),
        "]",
      ),

    /**
     * An elementary type name like `uint256` or `address`.
     */
    elementary_type_name: ($) =>
      choice(
        "address",
        "bool",
        "string",
        "bytes",
        /u?int[0-9]*/, // e.g., int, uint, uint256
        /bytes[0-9]+/, // e.g., bytes1, bytes32
      ),

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
  },
})
