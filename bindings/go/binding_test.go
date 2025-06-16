package tree_sitter_solidity_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_solidity "http://github.com/pyk/tree-sitter-solidity/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_solidity.Language())
	if language == nil {
		t.Errorf("Error loading Solidity grammar")
	}
}
