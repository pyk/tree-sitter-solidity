# Solidity Grammar for Tree Sitter

## Setup

Install `tree-sitter` CLI:

```shell
brew install tree-sitter
```

Install dependencies:

```shell
pnpm install
```

## Development

Run the following command to run the local playground:

```shell
tree-sitter generate && tree-sitter build --wasm && tree-sitter playground
```

## Unit Tests

Run the following command to run the test:

```shell
tree-sitter test
```

## References

- [Solidity - Language Grammar](https://docs.soliditylang.org/en/stable/grammar.html)
