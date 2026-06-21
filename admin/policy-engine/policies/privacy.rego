# Privacy policy (admin domain 3). Default-deny telemetry.
package b2030b.privacy

import rego.v1

default fingerprint_randomization := "standard"
default telemetry := "off"

fingerprint_randomization := level if {
	some l in input.layers
	l.layer in {"enterprise", "local_admin"}
	level := l.privacy.fingerprintRandomization
}

# Telemetry only turns on if an enterprise layer explicitly enables it.
telemetry := g if {
	some l in input.layers
	l.layer == "enterprise"
	g := l.privacy.telemetryGranularity
}

decision := {"fingerprint": fingerprint_randomization, "telemetry": telemetry}
