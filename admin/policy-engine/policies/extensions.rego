# Extensions policy (admin domain 6).
package b2030b.extensions

import rego.v1

default block_sideload := true

# Blocking webRequest requires explicit enterprise approval (MV4 rule).
blocking_web_request_allowed if {
	some l in input.layers
	l.layer == "enterprise"
	l.extensions.allowBlockingWebRequest == true
}

force_disabled(id) if {
	some l in input.layers
	some d in l.extensions.forceDisable
	d == id
}

decision := {
	"block_sideload": block_sideload,
	"blocking_web_request_allowed": blocking_web_request_allowed,
	"force_disabled": force_disabled(input.context.extension_id),
}
