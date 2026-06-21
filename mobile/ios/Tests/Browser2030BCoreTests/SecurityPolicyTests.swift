import XCTest
@testable import Browser2030BCore

final class SecurityPolicyTests: XCTestCase {

    func testDeniesByDefault() {
        let p = SecurityPolicy()
        XCTAssertFalse(p.isAllowed(.camera))
        XCTAssertFalse(p.isAllowed(.aiRemote))
        XCTAssertFalse(p.isAllowed(.telemetry))
    }

    func testHonorsAllowGrantAndExpiry() {
        var p = SecurityPolicy()
        p.set(Grant(capability: .camera, layer: .user, allowed: true, expiresAt: 1000))
        XCTAssertTrue(p.isAllowed(.camera, now: 500))
        XCTAssertFalse(p.isAllowed(.camera, now: 2000))
    }

    func testHigherLayerOverridesLower() {
        var p = SecurityPolicy()
        p.set(Grant(capability: .network, layer: .user, allowed: true))
        p.set(Grant(capability: .network, layer: .enterprise, allowed: false))
        XCTAssertFalse(p.isAllowed(.network))
    }

    func testLowerLayerCannotOverrideHigher() {
        var p = SecurityPolicy()
        p.set(Grant(capability: .network, layer: .enterprise, allowed: false))
        p.set(Grant(capability: .network, layer: .user, allowed: true))
        XCTAssertFalse(p.isAllowed(.network))
    }
}
