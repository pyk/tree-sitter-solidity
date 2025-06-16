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
    // TODO: add the actual grammar rules
    source_file: ($) => "hello",
  },
})
