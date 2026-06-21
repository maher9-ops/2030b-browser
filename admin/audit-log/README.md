# admin/audit-log

Tamper-evident audit logging for the Administrative Configuration Plane
(build brief §7.9). The Merkle-tree implementation lives in
[`admin/policy-engine/src/audit.rs`](../policy-engine/src/audit.rs) so it shares
the policy engine's process and hashing primitives.

## Properties

- **Append-only**: entries are never modified in place.
- **Tamper-evident**: a Merkle root is computed over all entries; any change to
  a past entry changes the root.
- **Anchorable**: the root can be periodically published to a public ledger for
  external verifiability (optional, enterprise-configured).

## Export formats

Driven by the `compliance` policy domain (`auditLogExport`):

| Format | Use |
|--------|-----|
| `syslog` | Forward to SIEM via RFC 5424 |
| `json` | Structured export for GRC tooling |
| `cef` | ArcSight Common Event Format |

## Entry shape

Each entry is a serialized `DecisionSpan` (see
`admin/policy-engine/src/provenance.rs`) plus a monotonic timestamp and the
acting persona (User / Local Admin / Enterprise).
