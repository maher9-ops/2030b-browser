import XCTest
@testable import Browser2030BCore

final class TabModelTests: XCTestCase {

    private func tab(_ name: String, pinned: Bool = false) -> Tab {
        Tab(title: name, url: URL(string: "https://\(name).example")!, isPinned: pinned)
    }

    func testAddAndClose() {
        var m = TabModel()
        let a = tab("a")
        m.add(a)
        m.add(tab("b"))
        XCTAssertEqual(m.count, 2)
        m.close(a.id)
        XCTAssertEqual(m.count, 1)
    }

    func testPinnedSortFirst() {
        var m = TabModel()
        m.add(tab("a"))
        let b = tab("b")
        m.add(b)
        m.add(tab("c"))
        m.pin(b.id, true)
        XCTAssertEqual(m.tabs.first?.id, b.id)
        XCTAssertTrue(m.tabs.first?.isPinned ?? false)
    }
}
