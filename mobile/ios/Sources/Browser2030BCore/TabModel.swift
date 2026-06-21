import Foundation

/// A single browser tab (pure model; the UIKit/AppKit view binds to it).
public struct Tab: Sendable, Identifiable, Equatable {
    public let id: UUID
    public var title: String
    public var url: URL
    public var isPinned: Bool

    public init(id: UUID = UUID(), title: String, url: URL, isPinned: Bool = false) {
        self.id = id
        self.title = title
        self.url = url
        self.isPinned = isPinned
    }
}

/// Ordered collection of tabs with pinned-first ordering.
public struct TabModel: Sendable {
    private(set) public var tabs: [Tab] = []

    public init() {}

    public mutating func add(_ tab: Tab) {
        tabs.append(tab)
        sortPinnedFirst()
    }

    public mutating func close(_ id: UUID) {
        tabs.removeAll { $0.id == id }
    }

    public mutating func pin(_ id: UUID, _ pinned: Bool) {
        guard let i = tabs.firstIndex(where: { $0.id == id }) else { return }
        tabs[i].isPinned = pinned
        sortPinnedFirst()
    }

    private mutating func sortPinnedFirst() {
        // Stable: pinned tabs first, preserving relative order otherwise.
        tabs = tabs.enumerated()
            .sorted { lhs, rhs in
                if lhs.element.isPinned != rhs.element.isPinned {
                    return lhs.element.isPinned && !rhs.element.isPinned
                }
                return lhs.offset < rhs.offset
            }
            .map { $0.element }
    }

    public var count: Int { tabs.count }
}
