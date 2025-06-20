#########
Resources
#########

General Resources
=================

* `Ethereum.org Developers page <https://ethereum.org/en/developers/>`_
* `Ethereum StackExchange <https://ethereum.stackexchange.com/>`_
* `Solidity website <https://soliditylang.org/>`_
* `Solidity changelog <https://github.com/ethereum/solidity/blob/develop/Changelog.md>`_
* `Solidity codebase on GitHub <https://github.com/ethereum/solidity/>`_
* `Solidity language users chat <https://matrix.to/#/#ethereum_solidity:gitter.im>`_
* `Solidity compiler developers chat <https://matrix.to/#/#ethereum_solidity-dev:gitter.im>`_
* `awesome-solidity <https://github.com/bkrem/awesome-solidity>`_
* `Solidity by Example <https://solidity-by-example.org/>`_
* `Solidity documentation community translations <https://github.com/solidity-docs>`_

Integrated (Ethereum) Development Environments
==============================================

* `Ape <https://docs.apeworx.io/ape>`_
        A Python-based web3 development tool for compiling, testing, and interacting with smart contracts.

* `Brownie <https://eth-brownie.readthedocs.io/en/stable/>`_
        A Python-based development and testing framework for smart contracts targeting the Ethereum Virtual Machine.
        💡 Note: As per the official docs, Brownie is no longer actively maintained.
        Future releases may come sporadically - or never at all.
        Check out Ape Framework (first in list) for all your python Ethereum development needs.

* `Dapp <https://dapp.tools/>`_
        Tool for building, testing and deploying smart contracts from the command-line.

* `Foundry <https://github.com/foundry-rs/foundry>`_
        Fast, portable and modular toolkit for Ethereum application development written in Rust.

* `Hardhat <https://hardhat.org/>`_
        Ethereum development environment with local Ethereum network, debugging features and plugin ecosystem.

* `Remix <https://remix.ethereum.org/>`_
        Browser-based IDE with integrated compiler and Solidity runtime environment without server-side components.

* `Truffle <https://trufflesuite.com/truffle/>`_
        Ethereum development framework.
        💡 Note: Consensys announced the sunset of Truffle on September 21, 2023.
        Current users may check out the migration path and available product support `here.
        <https://consensys.io/blog/consensys-announces-the-sunset-of-truffle-and-ganache-and-new-hardhat>`_

Editor Integrations
===================

* Emacs

    * `Emacs Solidity <https://github.com/ethereum/emacs-solidity/>`_
        Plugin for the Emacs editor providing syntax highlighting and compilation error reporting.

* IntelliJ

    * `IntelliJ IDEA plugin <https://plugins.jetbrains.com/plugin/9475-solidity/>`_
        Solidity plugin for IntelliJ IDEA (and all other JetBrains IDEs).

* Sublime Text

    * `Package for SublimeText - Solidity language syntax <https://packagecontrol.io/packages/Ethereum/>`_
        Solidity syntax highlighting for SublimeText editor.

* Vim

    * `Vim Solidity by Thesis <https://github.com/thesis/vim-solidity/>`_
        Syntax highlighting for Solidity in Vim.

    * `Vim Solidity by TovarishFin <https://github.com/TovarishFin/vim-solidity>`_
        Vim syntax file for Solidity.

    * `Vim Syntastic <https://github.com/vim-syntastic/syntastic>`_
        Plugin for the Vim editor providing compile checking.

* Visual Studio Code (VS Code)

    * `Ethereum Remix Visual Studio Code extension <https://github.com/ethereum/remix-vscode>`_
        Ethereum Remix extension pack for VS Code
        💡 Note: As per the official repository, this extension has been removed from the VSCODE marketplace and will be replaced by a dedicated stand-alone desktop application.

    * `Solidity Visual Studio Code extension, by Juan Blanco <https://juan.blanco.ws/solidity-contracts-in-visual-studio-code/>`_
        Solidity plugin for Microsoft Visual Studio Code that includes syntax highlighting and the Solidity compiler.

    * `Solidity Visual Studio Code extension, by Nomic Foundation <https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity>`_
        Solidity and Hardhat support by the Hardhat team, including: syntax highlighting, jump to definition, renames, quick fixes and inline solc warnings and errors.

    * `Solidity Visual Auditor extension <https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor>`_
        Adds security centric syntax and semantic highlighting to Visual Studio Code.

    * `Truffle for VS Code <https://marketplace.visualstudio.com/items?itemName=trufflesuite-csi.truffle-vscode>`_
        Build, debug and deploy smart contracts on Ethereum and EVM-compatible blockchains.
        💡 Note: This extension has built-in support for the Truffle Suite which is being sunset.
        For information on ongoing support, migration options and FAQs, visit the `Consensys blog.
        <https://consensys.io/blog/consensys-announces-the-sunset-of-truffle-and-ganache-and-new-hardhat>`_

Solidity Tools
==============

* `ABI to Solidity interface converter <https://gist.github.com/chriseth/8f533d133fa0c15b0d6eaf3ec502c82b>`_
    A script for generating contract interfaces from the ABI of a smart contract.

* `abi-to-sol <https://github.com/gnidan/abi-to-sol>`_
    Tool to generate Solidity interface source from a given ABI JSON.

* `Aderyn <https://github.com/Cyfrin/aderyn>`_
    Rust-based solidity smart contract static analyzer designed to help find vulnerabilities in Solidity code bases.

* `Doxity <https://github.com/DigixGlobal/doxity>`_
    Documentation Generator for Solidity.

* `ethdebug <https://github.com/ethdebug/format>`_
    A standard debugging data format for smart contracts on Ethereum-compatible networks.

* `Ethlint <https://github.com/duaraghav8/Ethlint>`_
    Linter to identify and fix style and security issues in Solidity.

* `evmdis <https://github.com/Arachnid/evmdis>`_
    EVM Disassembler that performs static analysis on the bytecode to provide a higher level of abstraction than raw EVM operations.

* `EVM Lab <https://github.com/ethereum/evmlab/>`_
    A collection of tools to interact with the EVM. The package includes a VM, Etherchain API, and a trace-viewer with gas cost display.

* `hevm <https://github.com/dapphub/dapptools/tree/master/src/hevm#readme>`_
    EVM debugger and symbolic execution engine.

* `leafleth <https://github.com/clemlak/leafleth>`_
    A documentation generator for Solidity smart-contracts.

* `Scaffold-ETH 2 <https://github.com/scaffold-eth/scaffold-eth-2>`_
    Forkable Ethereum development stack focused on fast product iterations.

* `sol2uml <https://www.npmjs.com/package/sol2uml>`_
    Unified Modeling Language (UML) class diagram generator for Solidity contracts.

* `solc-select <https://github.com/crytic/solc-select>`_
    A script to quickly switch between Solidity compiler versions.

* `Solidity prettier plugin <https://github.com/prettier-solidity/prettier-plugin-solidity>`_
    A Prettier Plugin for Solidity.

* `Solidity REPL <https://github.com/raineorshine/solidity-repl>`_
    Try Solidity instantly with a command-line Solidity console.

* `solgraph <https://github.com/raineorshine/solgraph>`_
    Visualize Solidity control flow and highlight potential security vulnerabilities.

* `Solhint <https://github.com/protofire/solhint>`_
    Solidity linter that provides security, style guide and best practice rules for smart contract validation.

* `Sourcify <https://sourcify.dev/>`_
    Decentralized automated contract verification service and public repository of contract metadata.

* `Sūrya <https://github.com/ConsenSys/surya/>`_
    Utility tool for smart contract systems, offering a number of visual outputs and information about the contracts' structure. Also supports querying the function call graph.

* `Universal Mutator <https://github.com/agroce/universalmutator>`_
    A tool for mutation generation, with configurable rules and support for Solidity and Vyper.

* `Wake <https://github.com/Ackee-Blockchain/wake>`_
    A Python-based Solidity development and testing framework with built-in vulnerability detectors.

Third-Party Solidity Parsers and Grammars
=========================================

* `Solidity Parser for JavaScript <https://github.com/solidity-parser/parser>`_
    A Solidity parser for JS built on top of a robust ANTLR4 grammar.
