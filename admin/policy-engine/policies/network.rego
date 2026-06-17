# Network policy (admin domain 2). See docs/02-admin-layer-spec.md.
package b2030b.network

import rego.v1

default doh_provider := "https://b2030b.example/dns-query"

doh_provider := provider if {
	some p in input.layers
	p.layer == "enterprise"
	provider := p.network.doh.provider
}

# Post-quantum KEM is required for regulated data residency.
pq_required if input.context.data_residency in {"eu", "sovereign"}

decision := {"doh_provider": doh_provider, "pq_kem": "required"} if pq_required
decision := {"doh_provider": doh_provider, "pq_kem": "preferred"} if not pq_required
