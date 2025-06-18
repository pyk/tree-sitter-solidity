# tree-sitter-solidity

Solidity Grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

## CST

```
source_file
|
|-- license?
|   `-- value: (license_identifier)
|
|-- directive*
|   |-- pragma
|   |   `-- (solidity | abicoder | experimental)
|   |       |-- (solidity)
|   |       |   `-- version: (version_constraint)+
|   |       |       |-- operator: (version_operator)?
|   |       |       `-- number: (version)
|   |       |
|   |       |-- (abicoder)
|   |       |   `-- version: (identifier)
|   |       |
|   |       `-- (experimental)
|   |           `-- feature: (identifier)
|   |
|   |-- import
|   `-- using
|
`-- definition*
    |-- contract
    |-- library
    `-- interface
```

Notes:

- `?` Optional
- `*` Zero or more
- `(Choice)` The child of pragma is a choice between solidity, abicoder, or experimental.
- `+` One or more

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

To update the test:

```shell
tree-sitter test -r --update
```

Run individual test file:

```shell
tree-sitter test --update -r --file-name pragma.txt
```

## References

- [Solidity - Language Grammar](https://docs.soliditylang.org/en/stable/grammar.html)
