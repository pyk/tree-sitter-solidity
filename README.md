# tree-sitter-solidity

Solidity Grammar for [tree-sitter](https://github.com/tree-sitter/tree-sitter).

## Concrete Syntax Tree

General structure:

```
source_file
|
|-- license?
|   `-- value: (license_identifier)
|
|-- directive*
|   |-- pragma
|   |   `-- (solidity | abicoder | experimental)
|   |       |
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
|   |   `-- (file_import | symbol_import | wildcard_import)
|   |       |
|   |       |-- (file_import)
|   |       |   |-- path: (string)
|   |       |   `-- alias: (symbol)?
|   |       |       `-- (identifier)
|   |       |
|   |       |-- (symbol_import)
|   |       |   |-- symbol: (imported_symbol)*
|   |       |   |   |-- name: (symbol)
|   |       |   |   |   `-- (identifier)
|   |       |   |   `-- alias: (symbol)?
|   |       |   |       `-- (identifier)
|   |       |   `-- path: (string)
|   |       |
|   |       `-- (wildcard_import)
|   |           |-- alias: (symbol)
|   |           |   `-- (identifier)
|   |           `-- path: (string)
|   |
|   `-- using
|       `-- (using_library | using_function)
|           |
|           |-- (using_library)
|           |   |-- library: (symbol)
|           |   |   |-- scope: (symbol)?
|           |   |   `-- name: (identifier)
|           |   |-- target: (type | wildcard)
|           |   `-- global?
|           |
|           `-- (using_function)
|               |-- declaration: (using_declaration)+
|               |   |-- name: (symbol)
|               |   |   |-- scope: (symbol)?
|               |   |   `-- name: (identifier)
|               |   `-- operator: (using_op)?
|               |-- target: (type | wildcard)
|               `-- global?
|
`-- definition*
    |-- contract
    |-- library
    `-- interface
```

Types:

```
type
|
`-- (primitive_type | custom_type | array_type | mapping_type | function_type)
    |
    |-- (primitive_type)
    |   `-- (address_type | bool_type | bytes_type | fixed_type | int_type | string_type | ufixed_type | uint_type)
    |       |
    |       `-- (address_type)
    |           `-- mutability: (payable)?
    |
    |-- (custom_type)
    |   `-- symbol: (symbol)
    |       |-- scope: (symbol)?
    |       `-- name: (identifier)
    |
    |-- (array_type)
    |   |-- base: (type)
    |   `-- size: (_expression)?
    |
    |-- (mapping_type)
    |   |-- key: (type)
    |   `-- value: (type)
    |
    `-- (function_type)
        |-- parameters: (parameter_list)?
        |   `-- parameter+
        |       |-- type: (type)
        |       |-- location: (data_location)?
        |       `-- name: (identifier)?
        |
        |-- visibility*
        |
        |-- mutability: (state_mutability)*
        |
        `-- returns: (parameter_list)?
            `-- parameter+
                |-- type: (type)
                |-- location: (data_location)?
                `-- name: (identifier)?
```

Notes:

- `?` Optional
- `*` Zero or more
- `(Choice)` e.g. The child of pragma is a choice between solidity, abicoder, or experimental.
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
tree-sitter generate && tree-sitter test --update --file-name pragma.txt
```

## References

- [Solidity - Language Grammar](https://docs.soliditylang.org/en/stable/grammar.html)
