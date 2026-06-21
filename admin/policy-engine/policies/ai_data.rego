# AI & Data policy (admin domain 7). Local-only by default.
package b2030b.ai_data

import rego.v1

default allow_remote := false

# Remote AI is allowed only if the endpoint is on the enterprise allowlist
# AND the current site is not on the no-AI list.
allow_remote if {
	some l in input.layers
	l.layer == "enterprise"
	some ep in l.aiData.allowedCloudEndpoints
	ep == input.context.endpoint
	not no_ai_site
}

no_ai_site if {
	some l in input.layers
	some s in l.aiData.noAiSites
	s == input.context.site
}

decision := {"allow_remote": allow_remote, "no_ai_site": no_ai_site}
