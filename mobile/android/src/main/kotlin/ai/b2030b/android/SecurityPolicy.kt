package ai.b2030b.android

/**
 * Default-deny security policy for the Android edition (Security/Privacy spec §3).
 *
 * Mirrors the Rust engine's capability model: every permission, network egress,
 * AI feature, and telemetry sink starts denied. The host app must explicitly
 * grant a capability (subject to admin policy) before it is honored.
 *
 * Kept free of Android framework types so it is unit-testable on the JVM.
 */
enum class Capability {
    NETWORK,
    GEOLOCATION,
    CAMERA,
    MICROPHONE,
    NOTIFICATIONS,
    AI_LOCAL,
    AI_REMOTE,
    TELEMETRY,
}

/** Where a decision came from, in increasing precedence. */
enum class PolicyLayer { DEFAULT, USER, LOCAL_ADMIN, ENTERPRISE }

data class Grant(
    val capability: Capability,
    val layer: PolicyLayer,
    val allowed: Boolean,
    /** Epoch millis after which the grant lapses; null = session. */
    val expiresAt: Long? = null,
)

class SecurityPolicy {
    private val grants = mutableMapOf<Capability, Grant>()

    /** Record a grant, but only if it comes from an equal-or-higher layer. */
    fun set(grant: Grant) {
        val existing = grants[grant.capability]
        if (existing == null || grant.layer.ordinal >= existing.layer.ordinal) {
            grants[grant.capability] = grant
        }
    }

    /** Default-deny query. A capability is allowed only by an unexpired allow. */
    fun isAllowed(capability: Capability, now: Long = System.currentTimeMillis()): Boolean {
        val g = grants[capability] ?: return false
        if (g.expiresAt != null && now >= g.expiresAt) return false
        return g.allowed
    }

    fun revoke(capability: Capability) {
        grants.remove(capability)
    }
}
