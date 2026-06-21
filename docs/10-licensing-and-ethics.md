# 10 — Licensing & Ethics (ML-1.1 / B2030B-1.0 Compliance)

This document explains how **The Browser 2030B License v1.0 (B2030B-1.0)** — a
*Derived License* based on **Maher's License v1.1 (ML-1.1)** — applies to Browser
2030B (`b2030b`), how we satisfy each obligation, and how third-party
dependencies are classified under the ML-1.1 **Part D** meta-license rubric.

- **Derived License that governs this Work:** [`../LICENSE-Browser2030B-1.0.md`](../LICENSE-Browser2030B-1.0.md)
- **Base license (binding, verbatim):** [`../LICENSE-ML-1.1.md`](../LICENSE-ML-1.1.md)
- **Prior base, retained for reference (ML-1.1 §E.3):** [`../LICENSE-ML-1.0.md`](../LICENSE-ML-1.0.md)
- Application notice for this project: [`../LICENSE`](../LICENSE)
- Use-obligations summary: [`../ETHICS.md`](../ETHICS.md)
- SPDX identifier for first-party code: **`LicenseRef-Browser2030B-1.0`**

## 0. Why a Derived License (ML-1.1 §E.6, §D.6)

ML-1.1 ships a reusable **drafting PROMPT** for producing a compliant *Derived
License* tailored to a specific system. We consumed it to generate
`LICENSE-Browser2030B-1.0.md`. The Derived License:

- **Inherits** ML-1.1's Foundational Principles and Parts A/B/C/E/F unchanged in
  substance, and **does not weaken** the Part C ethical floor.
- **Adds** browser-specific conditions **§C.9** (anti-stalkerware, anti-deceptive-
  UI, anti-safeguard-circumvention) — permitted as *stricter* terms under §E.6(a).
- **Omits Part D** (the meta-license machinery) per **§D.6**, because Browser
  2030B does not classify other licenses. Omission is compliant, not a deviation.
- **Tailors §B.6** so the network-source duty applies only to *modified*
  deployments of the **sync server** or **WASM cloud edition** (objective test),
  keeping the §B.6.5 operational-secret redaction carve-out.
- Carries its **own name and identifier** (`LicenseRef-Browser2030B-1.0`) and is
  **not** represented as ML-1.1 itself (§E.6(c)).

The Derived License contains a Derivation Statement, a review checklist against
the PROMPT's 8 mandatory constraints, and a risk/uncertainty note flagging
clauses for human attorney + Shariah-board review.

---

## 1. What ML-1.1 is (the base license)

ML-1.1 is a single instrument performing three roles (§0.1):

1. a **direct license** governing the Work (code, docs, datasets, designs);
2. an **ethical-source license** placing non-severable conditions on *use*
   (Part C); and
3. a **meta-license / compatibility rubric** for classifying other licenses
   (Part D).

It is grounded in four Foundational Principles — **Amanah** (trust), **Sidq**
(honesty), **Adl** (justice), **Shafafiyah** (transparency) — and subsidiary
norms against **Darar**, **Zulm**, **Gharar**, and **Riba** (§§1.2–1.3).

### What ML-1.1 hardened vs. ML-1.0 (the four critiques it addresses)

1. **§C.0 / §1.5 reinforcing layer** — Part C is a *reinforcing/remedial* layer
   grounding termination + scope-of-grant, **not** a freestanding new
   prohibition; no enforceability claimed beyond the forum's law.
2. **§B.6 network use** — scope set by an **objective** Network-Facing-Work test
   (§2.2), **not** deferred to any Steward ruling; redaction carve-out (§B.6.5).
3. **§1.3(iv) + §C.8 *Riba* / financial boundary** — Financial Functionality is
   **expressly permitted**; *Riba* is interpretive only; doubt → permission.
4. **§D.6 / §E.6 derivative licenses** — derived licenses may omit Part D and
   tailor Part B without being "incompatible."

### Honest labeling is mandatory (§0.2)

We **must not** call b2030b's license "open source" (OSI) or "free software"
(FSF). The only accurate description is **"source-available, ethical-source
license."** This applies to README, marketing, store listings, package metadata,
and any public statement. The SPDX expression is the **LicenseRef form**
`LicenseRef-Browser2030B-1.0` (Exhibit 2); a bare `Browser2030B-1.0` would
falsely imply registry/approval status and would breach *Sidq*.

---

## 2. How b2030b satisfies each obligation

| Clause | Obligation | How b2030b complies |
| --- | --- | --- |
| §0.2 Honest Labeling | Don't call it OSI/FSF | README, `LICENSE`, `ETHICS.md`, package metadata all say "source-available, ethical-source". CI check `honest-labeling` greps for forbidden phrasing near our license id. |
| §6 Attribution (*Sidq*) | Preserve notices, no misattribution | `LICENSE` Exhibit 1 notice; SPDX `LicenseRef-Browser2030B-1.0` on first-party manifests; this doc. |
| §B.2 Source availability | Provide corresponding source | Repository is the canonical source; release artifacts link back to the tagged commit; `packaging/*` embed the source URL. |
| §B.3 File-level reciprocity | Modified Work files stay B2030B-1.0 | Documented in `CONTRIBUTING.md` §2; reviewers enforce. |
| §B.5 Non-severability of Part C | Can't strip ethics | `ETHICS.md` + `CONTRIBUTING.md` make this explicit; the conditions travel with every file. |
| §B.6 Network use (objective test) | Offer source to remote users of a **modified** Network-Facing Work | Applies only to modified `sync/server` + `cloud/wasm-edition` deployments; source-offer endpoint tracked in `docs/09-deployment.md`; secrets redactable (§B.6.5). |
| §C.0/§1.5 Reinforcing layer | Don't overclaim; safeguards are primary | `LICENSE`, `ETHICS.md` state the 6 structural safeguards are PRIMARY; license is the fallback. |
| §C.8 Financial Functionality | Expressly permit financial use | `LICENSE`, `ETHICS.md`, this doc state financial functionality is permitted; *Riba* interpretive only. |
| §C.9 Browser-specific (added) | No purpose-built stalkerware / deceptive-UI / safeguard-circumvention | Derived License §C.9; subject to §C.6 knowledge standard. |
| Part C Ethical-Use Conditions | No fraud/harm/oppression/betrayal | `ETHICS.md`; acceptable-use surfaced in app About pages and store listings. |
| §E.2 Textual stability | Don't alter published text | `LICENSE-ML-1.1.md` (and `-ML-1.0.md`) kept **verbatim**; CI check fails on any diff. |
| §E.6 Derived-license honesty | Distinct name/id; not represented as ML-1.1 | `LICENSE-Browser2030B-1.0.md` Part I + §E.6 compliance block. |

---

## 3. First-party vs. third-party scope

- **First-party b2030b code** (every crate/package authored in this repo) →
  **B2030B-1.0** (`LicenseRef-Browser2030B-1.0`). Declared in the root
  `Cargo.toml` `[workspace.package]`, root `package.json`, and
  `ui/shell-desktop/src-tauri/Cargo.toml`.
- **Vendored engines** (Chromium/Blink under `engine/blink-integration`,
  `engine/v8-bindings`; Gecko under `engine/gecko-integration`,
  `engine/spidermonkey-bindings`) → **remain under their upstream licenses**
  (BSD-3-Clause / MPL-2.0 / Apache-2.0 as applicable). We do not relicense them.
- **Build/runtime dependencies** (crates.io, npm) → remain under their upstream
  licenses; allow-listed in [`../deny.toml`](../deny.toml).

The b2030b *distribution as a whole* (a "Larger Work" per §B.4) layers the
Part C Ethical-Use floor over the combined product. Upstream components keep
their own grants; the combination is offered subject to Part C.

---

## 4. Part D — dependency compatibility determinations

ML-1.1 Part D defines three classes (§D.3):

- **ML-Compatible** — the other license affirmatively carries comparable ethical
  conditions, or is explicitly recognized as fully compatible.
- **ML-Conditionally-Compatible** — the other license is permissive/copyleft but
  **silent on ethical use**; combination is permitted provided the Part C
  conditions are applied to the resulting Larger Work and honest labeling is kept.
- **ML-Incompatible** — the other license forbids the reciprocity/ethics terms
  ML-1.1 requires, or imposes conflicting obligations.

> **Note on authority.** Browser 2030B's own Derived License (B2030B-1.0) **omits
> Part D** per ML-1.1 §D.6 — b2030b does not adjudicate other licenses. We still
> *use* ML-1.1's Part D rubric here as the analytical framework for vetting our
> dependencies; that is permitted (a Work may be evaluated under the rubric
> without itself being a meta-license).

The procedure (§D.4) requires a good-faith, transparent, written determination
(*Shafafiyah* + *Adl*) and non-defamation of the evaluated license (§D.5).

### Determination table

| License (SPDX) | Where used | ML-1.1 Part D class | Rationale (§D.2 rubric) |
| --- | --- | --- | --- |
| `MPL-2.0` | Gecko/SpiderMonkey vendoring; some crates | **ML-Conditionally-Compatible** | File-level copyleft aligns with §B.3; silent on Part C ethics → combine and apply Part C to the Larger Work. |
| `Apache-2.0` | Chromium components; many crates | **ML-Conditionally-Compatible** | Permissive + patent grant; no ethics terms → conditionally compatible; preserve NOTICE per Apache §4. |
| `BSD-3-Clause` | Chromium/Blink; crates | **ML-Conditionally-Compatible** | Permissive, no ethics terms; keep the 3rd-clause non-endorsement notice. |
| `BSD-2-Clause` | crates | **ML-Conditionally-Compatible** | Permissive, silent on ethics. |
| `MIT` | npm + crates | **ML-Conditionally-Compatible** | Permissive, silent on ethics; preserve copyright notice. |
| `ISC` | crates | **ML-Conditionally-Compatible** | Functionally MIT-equivalent. |
| `Unicode-DFS-2016` | unicode data | **ML-Conditionally-Compatible** | Data license, silent on ethics. |
| `Zlib` | compression libs | **ML-Conditionally-Compatible** | Permissive, silent on ethics. |
| `GPL-3.0` / `AGPL-3.0` | *not currently used* | **Review required** | Strong copyleft could conflict with B2030B-1.0's own reciprocity; must be evaluated per §D.4 before adoption. |
| Proprietary / no-source | *prohibited* | **ML-Incompatible** | Cannot satisfy §B.2 source availability. |

> **Net effect:** all dependencies presently in the tree are
> **ML-Conditionally-Compatible**. None are ML-Incompatible. Adding a new
> dependency requires recording its class here before merge.

The enforcement allow-list lives in [`../deny.toml`](../deny.toml) and is checked
in CI (`cargo-deny`). The honest-labeling and verbatim-text checks live in
`ci/workflows/ml-compliance.yml`.

---

## 5. Adding a dependency — checklist

1. Identify the dependency's SPDX license.
2. Classify it against §D.3 and add a row to the table above (§D.4 written
   determination; cite the §D.2 rubric factor).
3. Add the SPDX id to `deny.toml` `allow` only if **not** ML-Incompatible.
4. If the license is silent on ethics (the common case), confirm the Part C
   floor still applies to the Larger Work — it does, automatically, via §B.4.
5. Preserve the upstream NOTICE/attribution.

---

## 6. Versioning of the license itself (Part E)

- First-party code is licensed under **B2030B-1.0 "Version 1.0 or any later
  version"** (see `LICENSE`), which is based on **ML-1.1**.
- The Steward may publish new versions (§E.3); published versions are immutable
  (§E.2), which is why `LICENSE-ML-1.1.md` and `LICENSE-ML-1.0.md` must never be
  edited in this repo. Per ML-1.1 §E.3, Works already under ML-1.0 stay valid
  under ML-1.0; this project now tracks ML-1.1 via the B2030B-1.0 Derived License.
- The Steward's registry is the canonical source of the text (§E.4). The copy
  here is a faithful mirror for offline builds.
