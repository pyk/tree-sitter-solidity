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
  ASSIGN: 0, // =
  CONDITIONAL: 1, // ?:
  OR: 2, // ||
  AND: 3, // &&
  EQUALITY: 4, // ==, !=
  COMPARE: 5, // <, >, <=, >=
  BIT_OR: 6, // |
  BIT_XOR: 7, // ^
  BIT_AND: 8, // &
  SHIFT: 9, // <<, >>, >>>
  ADD: 10, // +, -
  MULTIPLY: 11, // *, /, %
  EXP: 12, // **
  UNARY: 13, // -, ~, !, delete, ++, -- (prefix)
  POSTFIX: 14, // ++, -- (postfix)
  MEMBER: 15, // .
  CAST: 16,
  NEW: 17,
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
        $.variable,
        //
        prec(1, $.struct),
        prec(1, $.enum),
        prec(1, $.event),
        prec(1, $.error),
        prec(1, $.type),
        prec(1, $.function),
        //
        prec(1, $.contract),
        prec(1, $.interface),
        prec(1, $.library),
      ),

    //############################################################//
    //                          Comment                           //
    //############################################################//

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

    //############################################################//
    //                   Core & Semantic Tokens                   //
    //############################################################//

    /**
     * The basic syntactic unit for a name. This is the "token" that the lexer
     * recognizes. It is used throughout the grammar to represent any kind of
     * name, from variables to functions to contract names.
     */
    identifier: ($) => /[a-zA-Z_]\w*/,

    /**
     * A semantic wrapper for an identifier that represents a named declaration.
     * This rule uses `alias` to create a `(symbol)` node in the AST that
     * contains an `(identifier)`. This provides a universal, queryable node
     * for all named entities (functions, contracts, variables, etc.),
     * making static analysis and tool-building much easier.
     */
    symbol: ($) =>
      choice(
        // The base case: a symbol that is just a simple identifier.
        field("name", $.identifier),

        // The recursive case: a symbol with a scope and a name.
        prec.left(
          PREC.MEMBER, // Use member access precedence to handle associativity correctly
          seq(
            field("scope", $.symbol), // The scope is another symbol
            ".",
            field("name", $.identifier),
          ),
        ),
      ),

    // A hidden rule to capture the structure of a simple symbol.
    // This will be aliased for declaration names.
    _simple_symbol: ($) => field("name", $.identifier),

    global: ($) => "global",
    wildcard: ($) => "*",
    transient: ($) => "transient",

    //############################################################//
    //                           Types                            //
    //############################################################//

    // The visible root for all types.
    _type: ($) =>
      choice(
        // Give primitive_type higher precedence to resolve ambiguity
        // with identifiers that look like primitives (e.g., `uint`).
        prec(1, $.primitive_type),
        $.custom_type,
        $.array_type,
        $.mapping_type,
        $.function_type,
      ),

    primitive_type: ($) =>
      choice(
        $.address_type,
        $.bool_type,
        $.bytes_type,
        $.fixed_type,
        $.int_type,
        $.string_type,
        $.ufixed_type,
        $.uint_type,
      ),

    // Visible wrapper for user-defined types.
    custom_type: ($) => field("symbol", $.symbol),

    address_type: ($) =>
      prec.right(seq("address", optional(field("mutability", "payable")))),

    bool_type: ($) => "bool",

    bytes_type: ($) =>
      choice(
        "bytes",
        "bytes1",
        "bytes2",
        "bytes3",
        "bytes4",
        "bytes5",
        "bytes6",
        "bytes7",
        "bytes8",
        "bytes9",
        "bytes10",
        "bytes11",
        "bytes12",
        "bytes13",
        "bytes14",
        "bytes15",
        "bytes16",
        "bytes17",
        "bytes18",
        "bytes19",
        "bytes20",
        "bytes21",
        "bytes22",
        "bytes23",
        "bytes24",
        "bytes25",
        "bytes26",
        "bytes27",
        "bytes28",
        "bytes29",
        "bytes30",
        "bytes31",
        "bytes32",
      ),

    // We give the token a lexical precedence of 1 to ensure it is
    // preferred over the generic `identifier` token, which has a
    // default precedence of 0. This resolves the lexer ambiguity.
    fixed_type: ($) => token(prec(1, /fixed([0-9]+x[0-9]+)?/)),

    ufixed_type: ($) => token(prec(1, /ufixed([0-9]+x[0-9]+)?/)),

    int_type: ($) =>
      choice(
        "int",
        "int8",
        "int16",
        "int24",
        "int32",
        "int40",
        "int48",
        "int56",
        "int64",
        "int72",
        "int80",
        "int88",
        "int96",
        "int104",
        "int112",
        "int120",
        "int128",
        "int136",
        "int144",
        "int152",
        "int160",
        "int168",
        "int176",
        "int184",
        "int192",
        "int200",
        "int208",
        "int216",
        "int224",
        "int232",
        "int240",
        "int248",
        "int256",
      ),

    string_type: ($) => "string",

    uint_type: ($) =>
      choice(
        "uint",
        "uint8",
        "uint16",
        "uint24",
        "uint32",
        "uint40",
        "uint48",
        "uint56",
        "uint64",
        "uint72",
        "uint80",
        "uint88",
        "uint96",
        "uint104",
        "uint112",
        "uint120",
        "uint128",
        "uint136",
        "uint144",
        "uint152",
        "uint160",
        "uint168",
        "uint176",
        "uint184",
        "uint192",
        "uint200",
        "uint208",
        "uint216",
        "uint224",
        "uint232",
        "uint240",
        "uint248",
        "uint256",
      ),

    array_type: ($) =>
      seq(
        field("base", $._type),
        "[",
        optional(field("size", $._expression)),
        "]",
      ),

    mapping_type: ($) =>
      seq(
        "mapping",
        "(",
        field("key", $._type),
        "=>",
        field("value", $._type),
        ")",
      ),

    function_type: ($) =>
      prec.right(
        seq(
          "function",
          "(",
          optional(field("parameters", $.parameters)),
          ")",
          repeat(
            choice(
              field("visibility", $._visibility),
              field("mutability", $._function_mutability),
            ),
          ),
          optional(
            seq("returns", "(", optional(field("returns", $.parameters)), ")"),
          ),
        ),
      ),

    _visibility: ($) => choice($.public, $.private, $.internal, $.external),
    public: ($) => "public",
    private: ($) => "private",
    internal: ($) => "internal",
    external: ($) => "external",

    /**
     * A list of parameters, used for function arguments and return values.
     */
    parameters: ($) => commaSep(field("parameter", $.parameter)),

    /**
     * A single parameter declaration.
     * e.g., `uint256 _myVar` or `string memory _name`
     */
    parameter: ($) =>
      seq(
        field("type", $._type),
        optional(field("location", $._data_location)),
        optional(field("name", alias($._simple_symbol, $.symbol))),
      ),

    _data_location: ($) => choice($.memory, $.storage, $.calldata),
    memory: ($) => "memory",
    storage: ($) => "storage",
    calldata: ($) => "calldata",

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
    //                      Pragma directive                      //
    //############################################################//

    pragma: ($) =>
      seq(
        "pragma",
        choice(
          $.solidity,
          $.abicoder,
          $.experimental,
          // Other pragma
        ),
        ";",
      ),

    solidity: ($) =>
      seq("solidity", repeat1(field("version", $.version_constraint))),

    abicoder: ($) =>
      seq("abicoder", field("version", alias(/v[12]/, $.identifier))),

    experimental: ($) => seq("experimental", field("feature", $.identifier)),

    version_constraint: ($) =>
      seq(
        optional(field("operator", $.version_operator)),
        field("number", $.version),
      ),
    version_operator: ($) => choice("^", "~", ">=", "<=", ">", "<", "="),
    version: ($) => token(/(\d+)(\.\d+)?(\.\d+)?/),

    //############################################################//
    //                      Import directive                      //
    //############################################################//

    import: ($) =>
      seq(
        "import",
        choice(
          // e.g. import "./MyFile.sol"
          // e.g. import "./MyLib.sol" as MyLib;
          $.file_import,
          // e.g. import {symbol1, symbol2 as alias2} from "./MyFile.sol"
          $.symbol_import,
          // e.g. import * as MyLib from "./MyLib.sol";
          $.wildcard_import,
        ),
        ";",
      ),

    file_import: ($) =>
      seq(
        field("path", $.string),
        optional(seq("as", field("alias", $.symbol))),
      ),

    symbol_import: ($) =>
      seq(
        "{",
        // The list of specifiers is now directly here, as repeated fields.
        commaSep(field("symbol", $.imported_symbol)),
        "}",
        "from",
        field("path", $.string),
      ),

    imported_symbol: ($) =>
      seq(
        field("name", $.symbol),
        optional(seq("as", field("alias", $.symbol))),
      ),

    wildcard_import: ($) =>
      seq("*", "as", field("alias", $.symbol), "from", field("path", $.string)),

    //############################################################//
    //                      Using directive                       //
    //############################################################//

    using: ($) => seq("using", choice($.using_library, $.using_function), ";"),

    using_library: ($) =>
      seq(
        field("library", $.symbol),
        "for",
        field("target", choice($._type, $.wildcard)),
        optional(field("global", $.global)),
      ),

    using_function: ($) =>
      seq(
        "{",
        commaSep(field("declaration", $.using_declaration)),
        "}",
        "for",
        field("target", choice($._type, $.wildcard)),
        optional(field("global", $.global)),
      ),

    using_declaration: ($) =>
      seq(
        field("name", $.symbol),
        optional(seq("as", field("operator", $.using_op))),
      ),

    using_op: ($) =>
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

    //############################################################//
    //                          Literal                           //
    //############################################################//

    /**
     * A literal value, such as a number, string, boolean, or address.
     */
    literal: ($) =>
      choice(
        $.number,
        $.string,
        $.boolean,
        $.hex,
        $.hex_string,
        $.unicode_string,
      ),

    boolean: ($) => choice("true", "false"),
    hex: ($) => /0x[0-9a-fA-F]+/,
    hex_string: ($) => token(seq("hex", /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/)),
    unicode_string: ($) =>
      token(seq("unicode", /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/)),
    number: ($) => token(/\d+(\.\d*)?/),
    string: ($) => /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/,

    ether_literal: ($) =>
      prec(
        1,
        seq(
          field("value", $.number),
          field("unit", choice($.wei, $.gwei, $.ether)),
        ),
      ),
    wei: ($) => "wei",
    gwei: ($) => "gwei",
    ether: ($) => "ether",

    time_literal: ($) =>
      prec(
        1,
        seq(
          field("value", $.number),
          field("unit", choice($.seconds, $.minutes, $.hours, $.days, $.weeks)),
        ),
      ),
    seconds: ($) => "seconds",
    minutes: ($) => "minutes",
    hours: ($) => "hours",
    days: ($) => "days",
    weeks: ($) => "weeks",

    //############################################################//
    //                         Expression                         //
    //############################################################//

    /**
     * The main, hidden expression rule.
     * As a hidden rule, it doesn't appear in the AST. Instead, its chosen
     * child (e.g., add) is hoisted into its place.
     */
    _expression: ($) =>
      choice(
        // Type cast
        $.cast,

        // Group (a)
        $.group,

        // Arithmetic expressions
        $.arithmetic,

        // Bitwise expressions
        $.bitwise,

        // Comparison expressions
        $.comparison,

        // Equality expressions
        $.equality,

        // Logical expressions
        $.and,
        $.or,
        $.not,

        // Shift expression
        $.shift,

        // Primary expression
        $._primary_expression,

        // Others
        $.unary_expression,
        $.conditional_expression,
        $.payable_conversion_expression,
        $.meta_type_expression,
        $.call,
        $.member_access_expression,
        $.index_access_expression,
        $.index_range_access_expression,
        $.new_expression,
        $.assignment_expression,
        $.tuple_expression,
        $.inline_array_expression,
      ),

    //############################################################//
    //                     Primary Expression                     //
    //############################################################//

    _primary_expression: ($) =>
      choice(
        $.ether_literal,
        $.time_literal,
        $.literal,
        prec(2, $.builtin_function),
        prec(1, $.symbol),
      ),

    //############################################################//
    //                      Cast expression                       //
    //############################################################//

    cast: ($) =>
      prec(
        PREC.CAST,
        seq(field("type", $._type), "(", field("argument", $._expression), ")"),
      ),

    //############################################################//
    //                      Group expression                      //
    //############################################################//

    group: ($) => prec(1, seq("(", field("expression", $._expression), ")")),

    //############################################################//
    //                   Comparison expression                    //
    //############################################################//

    comparison: ($) =>
      prec.left(
        PREC.COMPARE,
        seq(
          field("left", $._expression),
          field("operator", $.comparison_op),
          field("right", $._expression),
        ),
      ),
    comparison_op: ($) => choice("<", ">", "<=", ">="),

    //############################################################//
    //                    Equality expression                     //
    //############################################################//

    equality: ($) =>
      prec.left(
        PREC.EQUALITY,
        seq(
          field("left", $._expression),
          field("operator", $.equality_op),
          field("right", $._expression),
        ),
      ),
    equality_op: ($) => choice("==", "!="),

    //############################################################//
    //                     Logical expression                     //
    //############################################################//

    and: ($) =>
      prec.left(
        PREC.AND,
        seq(
          field("left", $._expression),
          field("operator", $.and_op),
          field("right", $._expression),
        ),
      ),
    and_op: ($) => "&&",

    or: ($) =>
      prec.left(
        PREC.OR,
        seq(
          field("left", $._expression),
          field("operator", $.or_op),
          field("right", $._expression),
        ),
      ),
    or_op: ($) => "||",

    not: ($) =>
      prec.right(
        PREC.UNARY,
        seq(field("operator", $.not_op), field("argument", $._expression)),
      ),

    not_op: ($) => "!",

    //############################################################//
    //                   Arithmetic expression                    //
    //############################################################//

    arithmetic: ($) =>
      choice(
        // Unary
        $.negation, // -a
        $.increment, // ++a or a++
        $.decrement, // --a or a--
        // Binary
        $.exp,
        $.mul,
        $.add,
        $.sub,
        $.div,
        $.mod,
      ),

    negation: ($) =>
      prec.right(
        PREC.UNARY,
        seq(field("operator", $.negation_op), field("argument", $._expression)),
      ),
    negation_op: ($) => "-",

    increment: ($) => choice($.prefix_increment, $.postfix_increment),
    increment_op: ($) => "++",
    prefix_increment: ($) =>
      prec.right(
        PREC.UNARY,
        seq(
          field("operator", $.increment_op),
          field("argument", $._expression),
        ),
      ),
    postfix_increment: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("argument", $._expression),
          field("operator", $.increment_op),
        ),
      ),

    decrement: ($) => choice($.prefix_decrement, $.postfix_decrement),
    decrement_op: ($) => "--",
    prefix_decrement: ($) =>
      prec.right(
        PREC.UNARY,
        seq(
          field("operator", $.decrement_op),
          field("argument", $._expression),
        ),
      ),
    postfix_decrement: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("argument", $._expression),
          field("operator", $.decrement_op),
        ),
      ),

    exp: ($) =>
      prec.right(
        PREC.EXP,
        seq(
          field("left", $._expression),
          field("operator", $.exp_op),
          field("right", $._expression),
        ),
      ),
    exp_op: ($) => "**",

    add: ($) =>
      prec.left(
        PREC.ADD,
        seq(
          field("left", $._expression),
          field("operator", $.add_op),
          field("right", $._expression),
        ),
      ),
    add_op: ($) => "+",

    sub: ($) =>
      prec.left(
        PREC.ADD,
        seq(
          field("left", $._expression),
          field("operator", $.sub_op),
          field("right", $._expression),
        ),
      ),
    sub_op: ($) => "-",

    mul: ($) =>
      prec.left(
        PREC.MULTIPLY,
        seq(
          field("left", $._expression),
          field("operator", $.mul_op),
          field("right", $._expression),
        ),
      ),
    mul_op: ($) => "*",

    div: ($) =>
      prec.left(
        PREC.MULTIPLY,
        seq(
          field("left", $._expression),
          field("operator", $.div_op),
          field("right", $._expression),
        ),
      ),
    div_op: ($) => "/",

    mod: ($) =>
      prec.left(
        PREC.MULTIPLY,
        seq(
          field("left", $._expression),
          field("operator", $.mod_op),
          field("right", $._expression),
        ),
      ),
    mod_op: ($) => "%",

    //############################################################//
    //                     Bitwise expression                     //
    //############################################################//

    bitwise: ($) => choice($.bitand, $.bitor, $.bitxor, $.bitnot),

    bitand: ($) =>
      prec.left(
        PREC.BIT_AND,
        seq(
          field("left", $._expression),
          field("operator", $.bitand_op),
          field("right", $._expression),
        ),
      ),
    bitand_op: ($) => "&",

    bitor: ($) =>
      prec.left(
        PREC.BIT_OR,
        seq(
          field("left", $._expression),
          field("operator", $.bitor_op),
          field("right", $._expression),
        ),
      ),
    bitor_op: ($) => "|",

    bitxor: ($) =>
      prec.left(
        PREC.BIT_XOR,
        seq(
          field("left", $._expression),
          field("operator", $.bitxor_op),
          field("right", $._expression),
        ),
      ),
    bitxor_op: ($) => "^",

    bitnot: ($) =>
      prec.right(
        PREC.UNARY,
        seq(field("operator", $.bitnot_op), field("argument", $._expression)),
      ),
    bitnot_op: ($) => "~",

    //############################################################//
    //                      Shift expression                      //
    //############################################################//

    shift: ($) =>
      prec.left(
        PREC.SHIFT,
        seq(
          field("left", $._expression),
          field("operator", $.shift_op),
          field("right", $._expression),
        ),
      ),
    shift_op: ($) => choice("<<", ">>", ">>>"),

    //############################################################//
    //                      Call expression                       //
    //############################################################//

    /**
     * A function call expression, with optional call options.
     * e.g., `myFunction(arg1, arg2)` or `myFunc{value: 1 ether}()`
     */
    call: ($) =>
      prec(
        PREC.MEMBER,
        seq(
          field("function", $._expression),
          optional(field("options", $.call_options_block)),
          field("arguments", $.arguments),
        ),
      ),

    /**
     * An argument list for a function call.
     * e.g., `(arg1, arg2)` or `()`
     */
    arguments: ($) =>
      prec(
        1, // Add precedence here to resolve ambiguity
        seq(
          "(",
          // Make the comma-separated list of expressions optional
          // to correctly handle calls with no arguments.
          optional(commaSep(field("argument", $._expression))),
          ")",
        ),
      ),

    builtin_function: ($) =>
      field(
        "name",
        choice(
          $.keccak256,
          $.sha256,
          $.ripemd160,
          $.ecrecover,
          $.addmod,
          $.mulmod,
          $.require,
          $.assert,
          $.revert,
          $.selfdestruct,
          $.gasleft,
        ),
      ),

    // Cryptography
    keccak256: ($) => "keccak256",
    sha256: ($) => "sha256",
    ripemd160: ($) => "ripemd160",
    ecrecover: ($) => "ecrecover",

    // Mathematical
    addmod: ($) => "addmod",
    mulmod: ($) => "mulmod",

    // Error Handling
    require: ($) => "require",
    assert: ($) => "assert",
    revert: ($) => "revert",

    // Contract & Transaction
    selfdestruct: ($) => "selfdestruct",
    gasleft: ($) => "gasleft",

    //############################################################//
    //                          Variable                          //
    //############################################################//

    variable: ($) =>
      seq(
        field("type", $._type),
        repeat($._variable_attribute),
        field("name", alias($._simple_symbol, $.symbol)),
        optional(seq("=", field("value", $._expression))),
        ";",
      ),

    _variable_attribute: ($) =>
      choice(
        field("visibility", $._visibility),
        field("mutability", choice($.constant, $.immutable)),
        field("override", $.overrides),
        field("transient", $.transient),
      ),

    constant: ($) => "constant",
    immutable: ($) => "immutable",

    overrides: ($) =>
      seq(
        "override",
        optional(seq("(", commaSep(field("target", $.symbol)), ")")),
      ),

    //############################################################//
    //                    Contract definition                     //
    //############################################################//

    contract: ($) =>
      seq(
        optional(field("abstract", $.abstract)),
        "contract",
        field("name", alias($._simple_symbol, $.symbol)),
        optional(field("parents", $.parent_list)),
        "{", // The body starts here
        repeat(field("definition", $._contract_level_definitions)),
        "}", // The body ends here
      ),

    _contract_level_definitions: ($) =>
      choice(
        $.constructor,
        $.enum,
        $.error,
        $.event,
        $.fallback_function_definition,
        $.function,
        $.modifier_definition,
        $.receive,
        $.struct,
        $.type,
        $.using,
        $.variable,
      ),

    abstract: ($) => "abstract",
    parent_list: ($) => seq("is", commaSep(field("parent", $.parent))),
    parent: ($) =>
      seq(
        field("name", alias($._simple_symbol, $.symbol)),
        optional(field("arguments", $.arguments)),
      ),

    //############################################################//
    //                    Interface Definition                    //
    //############################################################//

    interface: ($) =>
      seq(
        "interface",
        field("name", alias($._simple_symbol, $.symbol)),
        optional(field("parents", $.parent_list)),
        "{", // The body starts here
        repeat(field("definition", $._interface_level_definitions)),
        "}", // The body ends here
      ),

    _interface_level_definitions: ($) =>
      choice($.enum, $.error, $.event, $.function, $.struct, $.type),

    //############################################################//
    //                     Library definition                     //
    //############################################################//

    library: ($) =>
      seq(
        "library",
        field("name", alias($._simple_symbol, $.symbol)),
        "{", // The body starts here
        repeat(field("definition", $._library_level_definitions)),
        "}", // The body ends here
      ),

    _library_level_definitions: ($) =>
      choice(
        $.enum,
        $.error,
        $.event,
        $.function,
        $.struct,
        $.type,
        $.using,
        $.variable,
      ),

    //############################################################//
    //                     Struct definition                      //
    //############################################################//

    struct: ($) =>
      seq(
        "struct",
        field("name", alias($._simple_symbol, $.symbol)),
        "{",
        field("member", repeat($.struct_member)),
        "}",
      ),

    struct_member: ($) =>
      seq(
        field("type", $._type),
        field("name", alias($._simple_symbol, $.symbol)),
        ";",
      ),

    //############################################################//
    //                      Enum definition                       //
    //############################################################//

    enum: ($) =>
      seq(
        "enum",
        field("name", alias($._simple_symbol, $.symbol)),
        "{",
        // The commaSep helper handles one or more comma-separated values
        commaSep(field("value", alias($._simple_symbol, $.symbol))),
        "}",
      ),

    //############################################################//
    //                      Event definition                      //
    //############################################################//

    event: ($) =>
      seq(
        "event",
        field("name", alias($._simple_symbol, $.symbol)),
        "(",
        optional(field("parameters", $.event_parameters)),
        ")",
        optional($.anonymous),
        ";",
      ),

    event_parameter: ($) =>
      seq(
        field("type", $._type),
        optional(field("indexed", $.indexed)),
        optional(field("name", alias($._simple_symbol, $.symbol))),
      ),

    indexed: ($) => "indexed",

    event_parameters: ($) => commaSep(field("parameter", $.event_parameter)),

    // Rule for the `anonymous` keyword
    anonymous: ($) => "anonymous",

    //############################################################//
    //                      Error definition                      //
    //############################################################//

    error: ($) =>
      seq(
        "error",
        field("name", alias($._simple_symbol, $.symbol)),
        "(",
        optional(field("parameters", $.error_parameters)),
        ")",
        ";",
      ),

    error_parameters: ($) => field("parameter", commaSep($.error_parameter)),

    error_parameter: ($) =>
      seq(
        field("type", $._type),
        optional(field("name", alias($._simple_symbol, $.symbol))),
      ),

    //############################################################//
    //                      Type definition                       //
    //############################################################//

    type: ($) =>
      seq(
        "type",
        field("name", alias($._simple_symbol, $.symbol)),
        "is",
        field("base", $.primitive_type),
        ";",
      ),

    //############################################################//
    //                    Function definition                     //
    //############################################################//

    virtual: ($) => "virtual",

    function: ($) =>
      seq(
        "function",
        field("name", alias($._simple_symbol, $.symbol)),
        "(",
        optional(field("parameters", $.parameters)),
        ")",
        repeat($._function_attribute),
        optional(
          seq("returns", "(", optional(field("returns", $.parameters)), ")"),
        ),
        choice(field("body", $.block), ";"),
      ),

    _function_attribute: ($) =>
      choice(
        // Give specific keywords higher precedence (2)
        prec(2, field("visibility", $._visibility)),
        prec(2, field("mutability", $._function_mutability)),
        prec(2, field("virtual", $.virtual)),
        prec(2, field("override", $.overrides)),
        // Give the generic modifier invocation lower precedence (1)
        prec(1, field("modifier", $.function_modifier)),
      ),

    _function_mutability: ($) => choice($.pure, $.view, $.payable),
    pure: ($) => "pure",
    view: ($) => "view",
    payable: ($) => "payable",

    /**
     * A block of statements enclosed in curly braces.
     */
    block: ($) => seq("{", repeat($._statement), "}"),

    function_modifier: ($) =>
      seq(field("name", $.symbol), optional(field("arguments", $.arguments))),

    _modifier_attribute: ($) =>
      choice(field("virtual", $.virtual), field("override", $.overrides)),

    modifier_definition: ($) =>
      prec(
        1,
        seq(
          "modifier",
          field("name", alias($._simple_symbol, $.symbol)),
          "(",
          optional(field("parameters", $.parameters)),
          ")",
          repeat($._modifier_attribute),
          choice(field("body", $.block), ";"),
        ),
      ),

    //############################################################//
    //                        Constructor                         //
    //############################################################//

    constructor: ($) =>
      seq(
        "constructor",
        "(",
        optional(field("parameters", $.parameters)),
        ")",
        repeat($._constructor_attribute),
        field("body", $.block),
      ),

    _constructor_attribute: ($) =>
      choice(
        // Give specific keywords higher precedence (2)
        prec(2, field("visibility", $._visibility)),
        prec(2, field("mutability", $._function_mutability)),
        // Give the generic parent constructor invocation lower precedence (1)
        prec(1, field("parent_constructor", $.parent_constructor)),
      ),

    parent_constructor: ($) =>
      seq(field("name", $.symbol), field("arguments", $.arguments)),

    //############################################################//
    //                Receive function definition                 //
    //############################################################//

    // The receive function definition
    receive: ($) =>
      seq(
        "receive",
        "(",
        ")",
        repeat($._function_attribute),
        choice(field("body", $.block), ";"),
      ),

    //############################################################//
    //                           Others                           //
    //############################################################//

    // The fallback function definition
    fallback_function_definition: ($) =>
      seq(
        "fallback",
        "(",
        optional(field("parameters", $.parameters)),
        ")",
        repeat($._function_attribute),
        optional(
          seq("returns", "(", optional(field("returns", $.parameters)), ")"),
        ),
        choice(field("body", $.block), ";"),
      ),

    //************************************************************//
    //                        Declarations                        //
    //************************************************************//

    /**
     * A single variable declaration, used in statements and tuples.
     * e.g., `uint256 myVar` or `string memory name`
     */
    variable_declaration: ($) =>
      seq(
        field("type", $._type),
        optional(field("location", $._data_location)),
        optional(field("name", alias($._simple_symbol, $.symbol))),
      ),

    /**
     * A tuple of variable declarations. Can contain empty slots.
     * e.g., `(uint a, , uint c)`
     */
    variable_declaration_tuple: ($) =>
      // Give this rule a higher precedence than tuple_expression to resolve ambiguity.
      prec(1, seq("(", commaSep(optional($.variable_declaration)), ")")),

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
    emit_statement: ($) => seq("emit", $.call, ";"),

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
          field("error", $.symbol),
          field("arguments", $.arguments),
          ";",
        ),
      ),

    //************************************************************//
    //                      Expression Rules                      //
    //************************************************************//

    // _expression
    // ├── primary_expression
    // │   ├── literal
    // │   │   ├── number
    // │   │   ├── string
    // │   │   ├── boolean_literal
    // │   │   └── hex_literal
    // │   └── identifier
    // ├── add
    // │   ├── left: _expression
    // │   ├── operator: add_op
    // │   └── right: _expression
    // ├── mul
    // │   ├── left: _expression
    // │   ├── operator: mul_op
    // │   └── right: _expression
    // ├── assignment_expression
    // │   ├── left: _expression
    // │   ├── operator: assignment_operator
    // │   └── right: _expression
    // └── tuple_expression
    //     └── _expression (repeated)

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
        // Prefix operators (e.g., `!a`) are right-associative.
        prec.right(
          PREC.UNARY,
          seq(field("operator", "delete"), field("argument", $._expression)),
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
     * The options block for a function call.
     * e.g., `{value: 1, gas: 10000}`
     */
    call_options_block: ($) => seq("{", commaSep($.named_argument), "}"),

    /**
     * An argument in a function call options block.
     * e.g., `value: 1 ether` or `gas: 10000`
     */
    named_argument: ($) =>
      seq(
        field("name", alias($._simple_symbol, $.symbol)),
        ":",
        field("value", $._expression),
      ),

    /**
     * A member access expression.
     * e.g., `myVariable.property`
     *
     * This rule is made left-associative using `prec.left` to ensure that
     * chained member access is parsed correctly. For example, an expression
     * like `a.b.c` is grouped from left to right as `(a.b).c`.
     *
     * It shares the same high precedence level as `call` (`PREC.MEMBER`)
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
      prec.right(PREC.NEW, seq("new", field("type", $._type))),

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

    /**
     * Named operator rules. Because these are named, they will appear
     * in the final syntax tree.
     */

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
    tuple_expression: ($) =>
      seq(
        "(",
        optional(
          // A tuple must have zero elements, or at least two elements.
          // This structure avoids matching a single-element parenthesized expression.
          seq($._expression, ",", commaSep($._expression)),
        ),
        ")",
      ),

    /**
     * A `payable` conversion expression.
     * e.g., `payable(myAddress)`
     */
    payable_conversion_expression: ($) =>
      prec(
        1, // Give it a lower precedence than address_type
        seq("payable", field("arguments", $.arguments)),
      ),

    /**
     * A `type` expression for retrieving type information.
     * e.g., `type(MyContract)`
     */
    meta_type_expression: ($) =>
      prec(PREC.MEMBER, seq("type", "(", field("type", $._type), ")")),

    /**
     * An inline array expression.
     * e.g., `[1, 2, 3]` or `[]`
     */
    inline_array_expression: ($) =>
      seq("[", optional(commaSep($._expression)), "]"),
  },
})
