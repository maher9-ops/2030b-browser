# Compliance policy (admin domain 9). Tamper-evident logging always on.
package b2030b.compliance

import rego.v1

default tamper_evident_log := true

active_frameworks := fw if {
	some l in input.layers
	l.layer == "enterprise"
	fw := l.compliance.frameworks
}

decision := {
	"tamper_evident_log": tamper_evident_log,
	"frameworks": active_frameworks,
}
