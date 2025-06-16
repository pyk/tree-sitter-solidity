/**
 * @file Solidity grammar for tree-sitter
 * @author pyk <gm@pyk.sh>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "solidity",

  rules: {
    /**
     * The top-level rule, representing a complete Solidity source file.
     * It consists of a sequence of top-level declarations and directives.
     */
    source_file: ($) => repeat($._top_level_element),

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
        // $.import_directive,
        // $.using_directive,
        // $.contract_definition,
        // $.interface_definition,
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
    //                       SPDX License                         //
    //************************************************************//

    /**
     * The SPDX license identifier, which should appear at the top of a source file.
     * This rule captures the license string itself in a 'license' field.
     * e.g., `// SPDX-License-Identifier: MIT`
     */
    spdx_license_identifier: ($) =>
      seq(
        /\/\/\s*SPDX-License-Identifier:/,
        field("license", $.license_identifier),
      ),

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
    _pragma_expression: ($) =>
      repeat1($.version_constraint),

    /**
     * A version constraint, such as `^0.8.0` or `>=0.8.0 <0.9.0`.
     * This is now a visible node in the syntax tree.
     */
    version_constraint: ($) =>
      seq(optional($.version_operator), $.version_literal),

    // An operator used for version constraints (hidden helper rule).
    version_operator: ($) =>
      choice("^", "~", ">=", "<=", ">", "<", "="),

    // A semantic version number (visible node).
    version_literal: ($) => /\d+(\.\d+){0,2}/,

    identifier: ($) => /[a-zA-Z_]\w*/,
  },
})
