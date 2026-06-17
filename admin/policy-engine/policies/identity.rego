# Identity & Profiles policy (admin domain 1).
package b2030b.identity

import rego.v1

default passkey_provisioning := "optional"

passkey_provisioning := p if {
	some layer in input.layers
	layer.layer == "enterprise"
	p := layer.identity.passkeyProvisioning
}

# Profile lockdown is on whenever any enterprise layer requests it.
profile_lockdown if {
	some layer in input.layers
	layer.layer == "enterprise"
	layer.identity.profileLockdown == true
}

decision := {
	"passkey_provisioning": passkey_provisioning,
	"profile_lockdown": profile_lockdown,
}
