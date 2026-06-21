# Security policy (admin domain 4).
package b2030b.security

import rego.v1

default v8_sandbox := true
default secure_dns := "preferred"

# Force JIT-less mode for any origin on the enterprise jitless list.
jitless_origin(origin) if {
	some l in input.layers
	l.layer == "enterprise"
	some o in l.security.jitlessOrigins
	o == origin
}

secure_dns := mode if {
	some l in input.layers
	l.layer == "enterprise"
	mode := l.security.secureDnsEnforcement
}

decision := {
	"v8_sandbox": v8_sandbox,
	"secure_dns": secure_dns,
	"jitless_for_request_origin": jitless_origin(input.context.origin),
}
