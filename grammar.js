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
     */
    pragma_directive: ($) =>
      seq(
        "pragma",
        field("name", $.identifier),
        field("value", repeat($._pragma_token)), // Using repeat for simplicity, allows zero or more tokens after name
        ";",
      ),

    _pragma_token: ($) =>
      choice(
        $.identifier,
        /(\d|\.)+/, // Matches version numbers like 0.8.0
        /[><=^~]+/, // Matches version operators like >= or ^
      ),

    identifier: ($) => /[a-zA-Z_]\w*/,
  },
})
