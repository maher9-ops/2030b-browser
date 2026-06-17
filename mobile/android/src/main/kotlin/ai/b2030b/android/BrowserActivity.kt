package ai.b2030b.android

import android.app.Activity
import android.os.Bundle

/**
 * Top-level browser activity. Hosts the (vendored) GeckoView engine and binds it
 * to the [SecurityPolicy]. The activity stays thin: all gating logic lives in the
 * testable policy model.
 *
 * GeckoView wiring is commented because the engine AAR is vendored and only
 * present on a provisioned mobile build runner.
 */
class BrowserActivity : Activity() {

    private val policy = SecurityPolicy()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Default-deny: nothing is granted until the user/admin opts in.
        // val view = GeckoView(this)
        // val session = GeckoSession(buildHardenedSettings())
        // session.permissionDelegate = PolicyPermissionDelegate(policy)
        // view.setSession(session)
        // setContentView(view)
    }

    /** Called by the permission delegate to enforce default-deny gating. */
    fun shouldGrant(capability: Capability): Boolean = policy.isAllowed(capability)
}
