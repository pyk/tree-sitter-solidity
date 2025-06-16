import XCTest
import SwiftTreeSitter
import TreeSitterSolidity

final class TreeSitterSolidityTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_solidity())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Solidity grammar")
    }
}
