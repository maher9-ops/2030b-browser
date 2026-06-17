# Update & Channel policy (admin domain 10). Signed updates enforced.
package b2030b.update_channel

import rego.v1

default signed_update_enforcement := true
default studies := false
default telemetry := false

channel := c if {
	some l in input.layers
	l.layer == "enterprise"
	c := l.updateChannel.channelPin
}

decision := {
	"channel": channel,
	"signed_update_enforcement": signed_update_enforcement,
	"studies": studies,
	"telemetry": telemetry,
}
