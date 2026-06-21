# Content policy (admin domain 5): allow/block lists with precedence.
package b2030b.content_policy

import rego.v1

default allow := false

# Blocklist wins over allowlist (deny precedence).
blocked if {
	some l in input.layers
	some pat in l.content.urlBlocklist
	glob.match(pat, ["/"], input.context.url)
}

allowed if {
	some l in input.layers
	some pat in l.content.urlAllowlist
	glob.match(pat, ["/"], input.context.url)
}

allow if {
	allowed
	not blocked
}

decision := {"allow": allow, "blocked": blocked}
