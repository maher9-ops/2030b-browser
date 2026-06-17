package ai.b2030b.android

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SecurityPolicyTest {

    @Test
    fun deniesByDefault() {
        val p = SecurityPolicy()
        assertFalse(p.isAllowed(Capability.CAMERA))
        assertFalse(p.isAllowed(Capability.AI_REMOTE))
        assertFalse(p.isAllowed(Capability.TELEMETRY))
    }

    @Test
    fun honorsAllowGrantAndExpiry() {
        val p = SecurityPolicy()
        p.set(Grant(Capability.CAMERA, PolicyLayer.USER, allowed = true, expiresAt = 1000L))
        assertTrue(p.isAllowed(Capability.CAMERA, now = 500L))
        assertFalse(p.isAllowed(Capability.CAMERA, now = 2000L))
    }

    @Test
    fun higherLayerOverridesLower() {
        val p = SecurityPolicy()
        p.set(Grant(Capability.NETWORK, PolicyLayer.USER, allowed = true))
        p.set(Grant(Capability.NETWORK, PolicyLayer.ENTERPRISE, allowed = false))
        assertFalse(p.isAllowed(Capability.NETWORK))
    }

    @Test
    fun lowerLayerCannotOverrideHigher() {
        val p = SecurityPolicy()
        p.set(Grant(Capability.NETWORK, PolicyLayer.ENTERPRISE, allowed = false))
        p.set(Grant(Capability.NETWORK, PolicyLayer.USER, allowed = true))
        assertFalse(p.isAllowed(Capability.NETWORK))
    }
}
