import Foundation

/// Capabilities a site or feature can request. Everything is denied by default
/// (Security/Privacy spec §3), matching the Rust engine's capability model.
public enum Capability: String, Sendable, CaseIterable {
    case network
    case geolocation
    case camera
    case microphone
    case notifications
    case aiLocal
    case aiRemote
    case telemetry
}

/// Policy layers in increasing precedence.
public enum PolicyLayer: Int, Sendable, Comparable {
    case `default` = 0
    case user = 1
    case localAdmin = 2
    case enterprise = 3

    public static func < (lhs: PolicyLayer, rhs: PolicyLayer) -> Bool {
        lhs.rawValue < rhs.rawValue
    }
}

/// A single capability grant.
public struct Grant: Sendable, Equatable {
    public let capability: Capability
    public let layer: PolicyLayer
    public let allowed: Bool
    /// Seconds since the reference date after which the grant lapses; nil = session.
    public let expiresAt: TimeInterval?

    public init(
        capability: Capability,
        layer: PolicyLayer,
        allowed: Bool,
        expiresAt: TimeInterval? = nil
    ) {
        self.capability = capability
        self.layer = layer
        self.allowed = allowed
        self.expiresAt = expiresAt
    }
}

/// Default-deny security policy. Not thread-safe by design — wrap in an actor at
/// the call site if shared across tasks (kept simple for unit testing).
public struct SecurityPolicy: Sendable {
    private var grants: [Capability: Grant] = [:]

    public init() {}

    /// Record a grant if it comes from an equal-or-higher layer than any existing.
    public mutating func set(_ grant: Grant) {
        if let existing = grants[grant.capability], grant.layer < existing.layer {
            return
        }
        grants[grant.capability] = grant
    }

    /// A capability is allowed only by an unexpired allow grant (default-deny).
    public func isAllowed(_ capability: Capability, now: TimeInterval = Date().timeIntervalSinceReferenceDate) -> Bool {
        guard let g = grants[capability] else { return false }
        if let expiry = g.expiresAt, now >= expiry { return false }
        return g.allowed
    }

    public mutating func revoke(_ capability: Capability) {
        grants[capability] = nil
    }
}
