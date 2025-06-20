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
        $.constant_variable,
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
        $._simple_symbol, // Base case: a simple symbol
        prec.left(
          // Recursive case: a qualified symbol
          PREC.MEMBER,
          seq(field("scope", $.symbol), ".", field("name", $.identifier)),
        ),
      ),

    // A hidden rule to capture the structure of a simple symbol.
    // This will be aliased for declaration names.
    _simple_symbol: ($) => field("name", $.identifier),

    global: ($) => "global",
    wildcard: ($) => "*",

    //############################################################//
    //                           Types                            //
    //############################################################//

    // The visible root for all types.
    _type: ($) =>
      choice(
        // Give _primitive_type higher precedence to resolve ambiguity
        // with identifiers that look like primitives (e.g., `uint`).
        prec(1, $._primitive_type),
        $.custom_type,
        $.array_type,
        $.mapping_type,
        $.function_type,
      ),

    _primitive_type: ($) =>
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
          field("solidity", $.solidity),
          field("abicoder", $.abicoder),
          field("experimental", $.experimental),
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
          // Case 1: `import "path" as Alias;` or `import "path";`
          seq(
            field("path", $.string),
            optional(seq("as", field("alias", $.symbol))),
          ),
          // Case 2: `import {a as b, c} from "path";`
          seq(
            "{",
            commaSep(field("symbol", $.imported_symbol)),
            "}",
            "from",
            field("path", $.string),
          ),
          // Case 3: `import * as Alias from "path";`
          seq(
            field("wildcard", $.wildcard),
            "as",
            field("alias", $.symbol),
            "from",
            field("path", $.string),
          ),
        ),
        ";",
      ),

    imported_symbol: ($) =>
      seq(
        field("name", $.symbol),
        optional(seq("as", field("alias", $.symbol))),
      ),

    //############################################################//
    //                      Using directive                       //
    //############################################################//

    using: ($) =>
      seq(
        "using",
        choice(
          // For library style: `using SafeMath for uint;`
          field("library", $.symbol),
          // For function style: `using {add, sub} for uint;`
          seq("{", commaSep(field("function", $.using_function)), "}"),
        ),
        "for",
        field("target", choice($._type, $.wildcard)),
        optional(field("global", $.global)),
        ";",
      ),

    using_function: ($) =>
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
        $._abi_call,
        $._arithmetic,
        $._bitwise,
        $._builtin_expression,
        $._global_variable,
        $._primary_expression,
        $.and,
        $.assignment,
        $.call,
        $.cast,
        $.comparison,
        $.conditional,
        $.eq,
        $.group,
        $.inline_array_expression,
        $.member,
        $.meta_type_expression,
        $.neq,
        $.new_expression,
        $.not,
        $.or,
        $.payable_conversion_expression,
        $.shift,
        $.slice,
        $.subsript,
        $.tuple_expression,
        $.unary_expression,
      ),

    //############################################################//
    //                     Primary Expression                     //
    //############################################################//

    _primary_expression: ($) =>
      choice(
        $.ether_literal,
        $.time_literal,
        $.literal,
        prec(1, alias($._simple_symbol, $.symbol)),
        $._primitive_type,
        $.this,
        $.super,
      ),

    this: ($) => "this",
    super: ($) => "super",

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
          field("operator", $._comparison_op),
          field("right", $._expression),
        ),
      ),
    _comparison_op: ($) => choice($.lt, $.gt, $.lte, $.gte),
    lt: ($) => "<",
    gt: ($) => ">",
    lte: ($) => "<=",
    gte: ($) => ">=",

    //############################################################//
    //                    Equality expression                     //
    //############################################################//

    // From line 665 to 679
    eq: ($) =>
      prec.left(
        PREC.EQUALITY,
        seq(
          field("left", $._expression),
          field("operator", $.eq_op),
          field("right", $._expression),
        ),
      ),
    eq_op: ($) => "==",

    neq: ($) =>
      prec.left(
        PREC.EQUALITY,
        seq(
          field("left", $._expression),
          field("operator", $.neq_op),
          field("right", $._expression),
        ),
      ),
    neq_op: ($) => "!=",

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

    _arithmetic: ($) =>
      choice(
        // Unary
        $.negation, // -a
        // $.increment, // ++a or a++
        alias($._prefix_increment, $.increment),
        alias($._postfix_increment, $.increment),
        // $.decrement, // --a or a--
        alias($._prefix_decrement, $.decrement),
        alias($._postfix_decrement, $.decrement),
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

    _prefix_increment: ($) =>
      prec.right(
        PREC.UNARY,
        seq(
          field("operator", $.increment_op),
          field("argument", $._expression),
        ),
      ),

    _postfix_increment: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("argument", $._expression),
          field("operator", $.increment_op),
        ),
      ),

    increment_op: ($) => "++",

    _prefix_decrement: ($) =>
      prec.right(
        PREC.UNARY,
        seq(
          field("operator", $.decrement_op),
          field("argument", $._expression),
        ),
      ),
    _postfix_decrement: ($) =>
      prec.left(
        PREC.POSTFIX,
        seq(
          field("argument", $._expression),
          field("operator", $.decrement_op),
        ),
      ),
    decrement_op: ($) => "--",

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

    _bitwise: ($) => choice($.bitand, $.bitor, $.bitxor, $.bitnot),

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
    member: ($) =>
      prec.left(
        PREC.MEMBER,
        seq(
          field("object", $._expression),
          ".",
          field("member", alias($._simple_symbol, $.symbol)),
        ),
      ),

    //############################################################//
    //                   Assignment expression                    //
    //############################################################//

    assignment: ($) =>
      prec.right(
        PREC.ASSIGN,
        seq(
          field("left", $._expression),
          field("operator", $._assignment_operator),
          field("right", $._expression),
        ),
      ),

    _assignment_operator: ($) =>
      choice(
        $.assign_op,
        $.add_assign_op,
        $.sub_assign_op,
        $.mul_assign_op,
        $.div_assign_op,
        $.mod_assign_op,
        $.shl_assign_op,
        $.shr_assign_op,
        $.or_assign_op,
        $.xor_assign_op,
        $.and_assign_op,
      ),

    // Define each operator as a named rule
    assign_op: ($) => "=",
    add_assign_op: ($) => "+=",
    sub_assign_op: ($) => "-=",
    mul_assign_op: ($) => "*=",
    div_assign_op: ($) => "/=",
    mod_assign_op: ($) => "%=",
    shl_assign_op: ($) => "<<=",
    shr_assign_op: ($) => ">>=",
    or_assign_op: ($) => "|=",
    xor_assign_op: ($) => "^=",
    and_assign_op: ($) => "&=",

    //############################################################//
    //                    Built-in expression                     //
    //############################################################//

    _builtin_expression: ($) =>
      choice(
        $.addmod,
        $.blobhash,
        $.blockhash,
        $.ecrecover,
        $.gasleft,
        $.keccak256,
        $.mulmod,
        $.ripemd160,
        $.sha256,
      ),

    // Cryptography
    keccak256: ($) =>
      seq("keccak256", "(", field("argument", $._expression), ")"),
    sha256: ($) => seq("sha256", "(", field("argument", $._expression), ")"),
    ripemd160: ($) =>
      seq("ripemd160", "(", field("argument", $._expression), ")"),
    ecrecover: ($) =>
      seq(
        "ecrecover",
        "(",
        field("hash", $._expression),
        ",",
        field("v", $._expression),
        ",",
        field("r", $._expression),
        ",",
        field("s", $._expression),
        ")",
      ),

    // Math
    addmod: ($) =>
      seq(
        "addmod",
        "(",
        field("x", $._expression),
        ",",
        field("y", $._expression),
        ",",
        field("k", $._expression),
        ")",
      ),
    mulmod: ($) =>
      seq(
        "mulmod",
        "(",
        field("x", $._expression),
        ",",
        field("y", $._expression),
        ",",
        field("k", $._expression),
        ")",
      ),

    // Contract & Transaction
    gasleft: ($) => seq("gasleft", "(", ")"),
    blockhash: ($) =>
      seq("blockhash", "(", field("block_number", $._expression), ")"),
    blobhash: ($) => seq("blobhash", "(", field("index", $._expression), ")"),

    //############################################################//
    //                 Global variable expression                 //
    //############################################################//

    // A grouping rule for all global variables, to keep the `_expression` rule clean.
    _global_variable: ($) =>
      choice(
        // block members
        $.block_timestamp,
        $.block_number,
        $.block_coinbase,
        $.block_chainid,
        $.block_basefee,
        $.block_difficulty,
        $.block_gaslimit,
        $.block_prevrandao,
        $.block_blobbasefee,
        // msg members
        $.msg_data,
        $.msg_sender,
        $.msg_sig,
        $.msg_value,
        // tx members
        $.tx_gasprice,
        $.tx_origin,
      ),

    // Block Properties
    block_timestamp: ($) => seq("block", ".", "timestamp"),
    block_number: ($) => seq("block", ".", "number"),
    block_coinbase: ($) => seq("block", ".", "coinbase"),
    block_chainid: ($) => seq("block", ".", "chainid"),
    block_basefee: ($) => seq("block", ".", "basefee"),
    block_difficulty: ($) => seq("block", ".", "difficulty"),
    block_gaslimit: ($) => seq("block", ".", "gaslimit"),
    block_prevrandao: ($) => seq("block", ".", "prevrandao"),
    block_blobbasefee: ($) => seq("block", ".", "blobbasefee"),

    // Message Properties
    msg_data: ($) => seq("msg", ".", "data"),
    msg_sender: ($) => seq("msg", ".", "sender"),
    msg_sig: ($) => seq("msg", ".", "sig"),
    msg_value: ($) => seq("msg", ".", "value"),

    // Transaction Properties
    tx_gasprice: ($) => seq("tx", ".", "gasprice"),
    tx_origin: ($) => seq("tx", ".", "origin"),

    //############################################################//
    //                      ABI expressions                       //
    //############################################################//

    _abi_call: ($) =>
      choice(
        $.abi_decode,
        $.abi_encode,
        $.abi_encode_packed,
        $.abi_encode_with_selector,
        $.abi_encode_with_signature,
        $.abi_encode_call,
      ),

    abi_decode: ($) =>
      seq("abi", ".", "decode", field("arguments", $.arguments)),

    abi_encode: ($) =>
      seq("abi", ".", "encode", field("arguments", $.arguments)),

    abi_encode_packed: ($) =>
      seq("abi", ".", "encodePacked", field("arguments", $.arguments)),

    abi_encode_with_selector: ($) =>
      seq("abi", ".", "encodeWithSelector", field("arguments", $.arguments)),

    abi_encode_with_signature: ($) =>
      seq("abi", ".", "encodeWithSignature", field("arguments", $.arguments)),

    abi_encode_call: ($) =>
      seq("abi", ".", "encodeCall", field("arguments", $.arguments)),

    //############################################################//
    //                      Array expression                      //
    //############################################################//

    subsript: ($) =>
      prec.left(
        PREC.MEMBER,
        seq(
          field("base", $._expression),
          "[",
          field("index", $._expression),
          "]",
        ),
      ),

    slice: ($) =>
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

    //############################################################//
    //                   Conditional expression                   //
    //############################################################//

    conditional: ($) =>
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

    //############################################################//
    //                          Variable                          //
    //############################################################//

    // For Top-Level Constants
    constant_variable: ($) =>
      seq(
        field("type", $._type),
        "constant",
        field("name", alias($._simple_symbol, $.symbol)),
        "=",
        field("value", $._expression),
        ";",
      ),

    // For State Variables (Contract/Library/Interface level)
    state_variable: ($) =>
      seq(
        field("type", $._type),
        repeat(field("attribute", $._state_variable_attribute)),
        field("name", alias($._simple_symbol, $.symbol)),
        optional(seq("=", field("value", $._expression))),
        ";",
      ),

    // Helper for state_variable attributes
    _state_variable_attribute: ($) =>
      choice(
        field("visibility", $._visibility),
        field("mutability", choice($.constant, $.immutable)),
        field("override", $.overrides),
        field("transient", $.transient),
      ),

    constant: ($) => "constant",
    immutable: ($) => "immutable",
    transient: ($) => "transient",

    overrides: ($) =>
      seq(
        "override",
        optional(seq("(", commaSep(field("target", $.symbol)), ")")),
      ),

    // For Single Local Variables (Statement level)
    local_variable: ($) =>
      seq(
        field("type", $._type),
        optional(field("location", $._data_location)),
        field("name", alias($._simple_symbol, $.symbol)),
        optional(seq("=", field("value", $._expression))),
        ";",
      ),

    tuple_variable: ($) =>
      seq(
        "(",
        field(
          "elements",
          choice(
            // Handles cases with at least one declaration element, e.g., (uint a) or (uint a, )
            seq(
              $._tuple_variable_element,
              repeat(
                seq(",", optional(field("element", $._tuple_variable_element))),
              ),
            ),
            // Handles cases that start with a comma, e.g., (,uint b) or (,)
            seq(
              ",",
              commaSep(optional(field("element", $._tuple_variable_element))),
            ),
          ),
        ),
        ")",
        "=",
        field("value", $._expression),
        ";",
      ),

    // For Tuple Local Variables (Statement level)
    // Helper for individual elements in a tuple
    _tuple_variable_element: ($) =>
      seq(
        field("type", $._type),
        optional(field("location", $._data_location)),
        optional(field("name", alias($._simple_symbol, $.symbol))),
      ),

    //############################################################//
    //                    Contract definition                     //
    //############################################################//

    contract: ($) =>
      seq(
        optional(field("abstract", $.abstract)),
        "contract",
        field("name", alias($._simple_symbol, $.symbol)),
        optional(field("parents", $.parents)),
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
        $.fallback,
        $.function,
        $.modifier,
        $.receive,
        $.state_variable,
        $.struct,
        $.type,
        $.using,
      ),

    abstract: ($) => "abstract",
    parents: ($) => seq("is", commaSep(field("parent", $.parent))),
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
        optional(field("parents", $.parents)),
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
        $.modifier,
        $.state_variable,
        $.struct,
        $.type,
        $.using,
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
        optional(field("anonymous", $.anonymous)),
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
        field("base", $._primitive_type),
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

    function_modifier: ($) =>
      seq(field("name", $.symbol), optional(field("arguments", $.arguments))),

    _modifier_attribute: ($) =>
      choice(field("virtual", $.virtual), field("override", $.overrides)),

    //############################################################//
    //                          Modifier                          //
    //############################################################//

    modifier: ($) =>
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

    /**
     * A block of statements enclosed in curly braces.
     */
    block: ($) => seq("{", repeat(field("statement", $._statement)), "}"),

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
      seq(field("parent", $.symbol), field("arguments", $.arguments)),

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
    //                Fallback function definition                //
    //############################################################//

    fallback: ($) =>
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

    //############################################################//
    //                         Statements                         //
    //############################################################//

    /**
     * A placeholder for any statement.
     */
    _statement: ($) =>
      choice(
        $._expression_statement,
        $.assert,
        $.block,
        $.break,
        $.continue,
        $.do_while_statement,
        $.emit,
        $.for_statement,
        $.if_statement,
        $.local_variable,
        $.placeholder,
        $.return,
        $.require,

        // Revert
        alias($._revert_builtin, $.revert),
        alias($._revert_custom_error, $.revert),

        $.tuple_variable,
        $.unchecked,
        $.while_statement,

        $.selfdestruct,
      ),

    selfdestruct: ($) =>
      seq("selfdestruct", "(", field("recipient", $._expression), ")", ";"),

    _expression_statement: ($) => seq($._expression, ";"),
    assert: ($) =>
      seq("assert", "(", field("condition", $._expression), ")", ";"),
    break: ($) => seq("break", ";"),
    continue: ($) => seq("continue", ";"),
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
    emit: ($) =>
      seq(
        "emit",
        field("event", $.symbol),
        field("arguments", $.arguments),
        ";",
      ),
    for_statement: ($) =>
      seq(
        "for",
        "(",
        // This part correctly handles the three cases for the initializer
        // and consumes the first semicolon.
        field(
          "initializer",
          choice($.local_variable, $._expression_statement, ";"),
        ),

        // The condition is an optional expression, followed by a mandatory semicolon.
        field("condition", optional($._expression)),
        ";",

        // The update is an optional expression.
        field("update", optional($._expression)),

        ")",
        field("body", $._statement),
      ),
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

    placeholder: ($) => prec(1, seq("_", ";")),
    return: ($) => seq("return", optional(field("value", $._expression)), ";"),
    require: ($) =>
      seq(
        "require",
        "(",
        field("condition", $._expression),
        optional(
          seq(
            ",",
            choice(field("reason", $.string), field("error", $.custom_error)),
          ),
        ),
        ")",
        ";", // A statement ends with a semicolon
      ),
    // Reverts
    _revert_builtin: ($) =>
      seq("revert", "(", optional(field("reason", $._expression)), ")", ";"),

    _revert_custom_error: ($) =>
      seq("revert", field("error", $.custom_error), ";"),

    // This rule specifically parses a custom error instantiation
    custom_error: ($) =>
      seq(field("name", $.symbol), field("arguments", $.arguments)),

    unchecked: ($) => seq("unchecked", field("body", $.block)),

    while_statement: ($) =>
      seq(
        "while",
        "(",
        field("condition", $._expression),
        ")",
        field("body", $._statement),
      ),

    //############################################################//
    //                           Others                           //
    //############################################################//

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
