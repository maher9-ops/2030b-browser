# 02 — Administrative Configuration Plane Specification

The Admin Layer is a **first-class architectural tier** between the UI and the
engine. It is a Rust binary (`admin/policy-engine`) exposing a gRPC API over an
authenticated Unix domain socket / named pipe. It is not an extension, not a
settings page, and not optional.

## 1. Personas & Authentication

| Persona | Surface | Auth | Can override |
|---------|---------|------|--------------|
| End User | simplified UI | profile session | only values not locked above |
| Local Power Admin | `b2030b://admin` | OS biometric or admin password | anything not locked by Enterprise |
| Enterprise Admin | signed policy bundle via MDM/HTTPS | Ed25519 + ML-DSA signature | everything (top precedence) |

## 2. Conflict Resolution

Strict precedence, no exceptions:

```
Enterprise  >  Local Admin  >  User  >  Default
```

Every effective value is queryable with full provenance:

```jsonc
// GET effective value for key "network.doh.provider"
{
  "key": "network.doh.provider",
  "effective": "https://dns.quad9.net/dns-query",
  "source": "enterprise",        // which layer won
  "locked": true,                // user/local cannot override
  "trace": [
    { "layer": "default",    "value": "https://b2030b.example/dns-query" },
    { "layer": "user",       "value": "https://dns.google/dns-query" },
    { "layer": "enterprise", "value": "https://dns.quad9.net/dns-query", "locked": true }
  ]
}
```

## 3. The Ten Configurable Domains

Each domain has a JSON Schema in `admin/schemas/` and a Rego example in
`admin/policy-engine/policies/`.

| # | Domain | Schema | Rego policy |
|---|--------|--------|-------------|
| 1 | Identity & Profiles | `admin/schemas/identity.schema.json` | `policies/identity.rego` |
| 2 | Network | `admin/schemas/network.schema.json` | `policies/network.rego` |
| 3 | Privacy | `admin/schemas/privacy.schema.json` | `policies/privacy.rego` |
| 4 | Security | `admin/schemas/security.schema.json` | `policies/security.rego` |
| 5 | Content Policy | `admin/schemas/content-policy.schema.json` | `policies/content_policy.rego` |
| 6 | Extensions | `admin/schemas/extensions.schema.json` | `policies/extensions.rego` |
| 7 | AI & Data | `admin/schemas/ai-data.schema.json` | `policies/ai_data.rego` |
| 8 | UI/UX | `admin/schemas/ui-ux.schema.json` | `policies/ui_ux.rego` |
| 9 | Compliance | `admin/schemas/compliance.schema.json` | `policies/compliance.rego` |
| 10 | Update & Channel | `admin/schemas/update-channel.schema.json` | `policies/update_channel.rego` |

## 4. JSON Schema example (Network domain, excerpt)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://b2030b.example/schemas/network.schema.json",
  "title": "Network Policy",
  "type": "object",
  "properties": {
    "doh": {
      "type": "object",
      "properties": {
        "mode": { "enum": ["off", "best-effort", "strict"] },
        "provider": { "type": "string", "format": "uri" }
      },
      "required": ["mode"]
    },
    "pqKemEnforcement": { "enum": ["disabled", "preferred", "required"] },
    "tlsMinVersion": { "const": "1.3" }
  }
}
```

## 5. Rego policy example (Network domain)

```rego
package b2030b.network

import rego.v1

# Default-deny: no provider unless explicitly set by a higher layer.
default doh_provider := "https://b2030b.example/dns-query"

# Enterprise can force a resolver and lock it.
doh_provider := provider if {
    some p in input.layers
    p.layer == "enterprise"
    provider := p.network.doh.provider
}

# Post-quantum KEM is required when handling regulated data residency.
pq_required if {
    input.context.data_residency in {"eu", "sovereign"}
}

decision := {
    "doh_provider": doh_provider,
    "pq_kem": "required",
} if pq_required

decision := {
    "doh_provider": doh_provider,
    "pq_kem": "preferred",
} if not pq_required
```

## 6. Evaluation Engine

- Policies are evaluated by an **embedded OPA Wasm runtime** inside the Rust
  policy engine (`admin/policy-engine/src/opa.rs`).
- JSON Schema validates every bundle **before** load
  (`admin/policy-engine/src/schema.rs`).
- **Hot reload** without restart: a filesystem watcher recompiles changed
  bundles, computes an effective-policy diff, and broadcasts it over IPC to all
  processes (`admin/policy-engine/src/hot_reload.rs`).
- **Dry-run:** `b2030b policy simulate --bundle policy.rego --scenario s.json`
  is implemented in `tools/policy-simulator/`.
- **Observability:** every decision emits a structured OpenTelemetry span with
  `{decision, inputs, matched_rule, provenance}` (`src/telemetry.rs`).

## 7. Signed Bundle Format

```jsonc
{
  "schemaVersion": 1,
  "issuedAt": "2030-01-01T00:00:00Z",
  "expiresAt": "2030-04-01T00:00:00Z",
  "domains": { "network": { /* validated against network.schema.json */ } },
  "signatures": [
    { "alg": "Ed25519", "keyId": "ent-key-1", "sig": "base64..." },
    { "alg": "ML-DSA-65", "keyId": "ent-pq-1", "sig": "base64..." }
  ]
}
```

Both signatures must verify (classical + post-quantum) before a bundle is
accepted (`admin/policy-engine/src/signing.rs`).

## 8. Audit Logging

All admin actions and policy decisions are appended to a **tamper-evident
Merkle log** (`admin/audit-log/`), with optional public-ledger anchoring for
compliance. Export formats target GDPR/CCPA/HIPAA/SOC 2/FedRAMP/ISO 27001/PCI DSS.

## 9. MDM Connectors

`admin/mdm-connectors/` maps platform MDM channels to signed bundles:
Windows Group Policy ADMX, Microsoft Intune, Apple Jamf / configuration
profiles, and generic signed-JSON HTTPS pull.
