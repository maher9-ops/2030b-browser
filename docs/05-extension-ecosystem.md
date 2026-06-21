# 05 — Extension Ecosystem & Manifest V4

Browser 2030B is compatible with Chrome MV2/MV3, Firefox WebExtensions, and
Edge add-ons, and defines & ships **Manifest V4 (MV4)** — the successor to MV3.

## 1. Hosts & Shims

| Component | Path | Role |
|-----------|------|------|
| MV2 shim | `extensions/mv2-shim/` | Translates legacy MV2 (incl. blocking webRequest) to MV4 at install time |
| MV3 host | `extensions/mv3-host/` | Service workers, declarativeNetRequest, scripting API |
| MV4 host | `extensions/mv4-host/` | Native MV4 runtime (Rust) |
| Store client | `extensions/store-client/` | Chrome Web Store, AMO, Edge Add-ons, Browser 2030B Store |
| Policy bridge | `extensions/policy-bridge/` | Enforces admin extension domain (force-install/disable, caps, risk score) |

## 2. Manifest V4 — Specification

MV4 is JSON, backward-compatible in spirit with MV3, adding explicit AI/agent/
identity capabilities and capability tokens.

```jsonc
{
  "manifest_version": 4,
  "name": "Example Privacy Guard",
  "version": "1.0.0",
  "minimum_browser": "b2030b 1.0",

  // Reproducible build is mandatory for store submission.
  "reproducible_build": {
    "toolchain": "rust-1.82+node-20",
    "source": "https://example.invalid/ext/src.tar.zst",
    "digest": "sha256:..."
  },

  "background": { "service_worker": "sw.js", "type": "module" },

  // Classic permissions remain.
  "permissions": ["storage", "scripting", "declarativeNetRequest"],

  // Blocking webRequest returns — but ONLY under explicit admin approval,
  // intended for security extensions (uBlock-class).
  "blocking_web_request": {
    "requested": true,
    "justification": "Content blocking for privacy",
    "requires_admin_approval": true
  },

  // Native AI permissions.
  "ai_permissions": ["ai.local", "ai.remote", "ai.tools", "ai.observe"],

  // Agent permissions.
  "agent_permissions": ["agent.actuate", "agent.observe", "agent.network"],

  // Decentralized identity permissions.
  "did_permissions": ["did.sign", "did.verify", "vc.present"],

  // Capability tokens: expiring, origin-bound.
  "capability_tokens": {
    "host_access": {
      "origins": ["https://*.example.com"],
      "expires": "2030-12-31T00:00:00Z"
    }
  }
}
```

### 2.1 New permission semantics

| Permission | Meaning | Default |
|------------|---------|---------|
| `ai.local` | Call the bundled on-device model | deny |
| `ai.remote` | Call an admin-allowed cloud model endpoint | deny |
| `ai.tools` | Register tools the copilot can invoke | deny |
| `ai.observe` | Read AI copilot context (read-only) | deny |
| `agent.actuate` | Drive clicks/typing/navigation | deny |
| `agent.observe` | Observe agent action stream | deny |
| `agent.network` | Make network requests as the agent | deny |
| `did.sign` | Sign with a DID held by the wallet | deny |
| `did.verify` | Verify DIDs / VCs | allow (read-only) |
| `vc.present` | Present a Verifiable Credential | deny |

All default-deny except `did.verify` (read-only, no privacy impact).

### 2.2 Capability tokens

Tokens are **expiring** and **origin-bound**. The MV4 host mints a scoped token
per granted capability; the extension cannot widen its own scope. Tokens are
revoked on permission change, uninstall, or policy update.

### 2.3 Reproducible builds for store submission

Store submission requires a reproducible build descriptor. The Browser 2030B
Store verifies the published digest by rebuilding from the declared source in a
hermetic environment (`tools/repro-build/`). Mismatches are rejected.

## 3. Compatibility Shim

At install time, `extensions/mv2-shim` and the MV3 path auto-translate MV2/MV3
manifests to MV4:

- MV2 `webRequest` blocking → MV4 `blocking_web_request` with
  `requires_admin_approval: true` (surfaced as a DevTools warning).
- MV2 background pages → MV3/MV4 service workers (warning emitted).
- MV3 `host_permissions` → MV4 `capability_tokens.host_access` with no expiry by
  default (warning recommends adding one).
- Unsupported APIs raise a DevTools warning with a migration link.

## 4. Store Sources

Browser 2030B accepts extensions from:

1. **Chrome Web Store** (MV2/MV3, shimmed).
2. **Firefox Add-ons (AMO)** (`browser.*` namespace, shimmed).
3. **Edge Add-ons** (MV3, shimmed).
4. **Browser 2030B Store** (native MV4, signed reproducible builds).

Sideloading is blocked unless admin policy permits (`extensions` domain).

## 5. Admin Controls (cross-reference)

The `extensions` policy domain (`admin/schemas/extensions.schema.json`,
`policies/extensions.rego`) governs force-install/disable lists, allowlists by
ID or signature, permission caps, AI-driven install-time risk scoring, and
sideload blocking.

## References

- [Chrome Extensions MV3] https://developer.chrome.com/docs/extensions/
- [Firefox WebExtensions] https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions
- [W3C WebExtensions CG] https://www.w3.org/community/webextensions/
