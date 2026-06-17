# THE BROWSER 2030B LICENSE
## Version 1.0 (B2030B-1.0)
### A Derived Ethical-Source License Based on Maher's License, Version 1.1 (ML-1.1)

**Official designation:** The Browser 2030B License, Version 1.0
**Short identifier:** B2030B-1.0
**Based on:** Maher's License, Version 1.1 (ML-1.1) — see §E.6 of ML-1.1
**Document class:** Derived ethical-source, source-available license (NOT a meta-license — Part D omitted per ML-1.1 §D.6)
**Licensor / Steward of this Derived License:** Maher and the Browser 2030B contributors
**Canonical text of the base license (ML-1.1):** [`LICENSE-ML-1.1.md`](LICENSE-ML-1.1.md)
**Self-assigned identifier:** `LicenseRef-Browser2030B-1.0`

> **Honest-labeling and authorship notice (ML-1.1 §E.6(c), §0.2).** This is a
> *Derived License* "based on Maher's License, Version 1.1 (ML-1.1)." It is
> **not** ML-1.1 itself, it carries **no** approval from any standards body, and
> it is **not** an OSI "open source" or FSF "free software" license. It is a
> **source-available, ethical-source license**. It has its own distinct name and
> `LicenseRef-` identifier. Where this document is silent, the corresponding text
> of ML-1.1 ([`LICENSE-ML-1.1.md`](LICENSE-ML-1.1.md)) supplies the meaning.

> **DISCLAIMER — produced with AI assistance.** This Derived License was drafted
> by an AI agent acting in the role of an international lawyer working within an
> Islamic ethical-legal framework, in response to the reusable drafting PROMPT
> published in ML-1.1. **It is not a fatwa and not jurisdiction-specific legal
> advice.** Before relying on it in production or for redistribution, obtain
> review by a qualified human attorney and, where the *fiqh* grounding matters,
> a Shariah board. Clauses needing such review are flagged in Part R below.

---

## PART I — DERIVATION STATEMENT (required by ML-1.1 §E.6(c))

**Base license:** Maher's License, Version 1.1 (ML-1.1).
**Derived License:** The Browser 2030B License, Version 1.0 (B2030B-1.0).
**System governed:** Browser 2030B (codename `b2030b`) — a privacy-first,
capability-secured web browser and its engine/networking/policy/AI-runtime/sync
monorepo, plus its desktop/mobile shells, extensions host, WASM cloud edition,
and sync server.

**Primary delivery mode (ML-1.1 §2.2):** **Both.** The browser, engine crates,
desktop installers, and mobile apps are **Conveyed-Copy Works** (recipients run
their own copy). The **sync server** (`sync/server`) and the **WASM cloud
edition** (`cloud/wasm-edition`) can be deployed as **Network-Facing Works**.
Classification is per deployment (§B.6).

**Financial Functionality (ML-1.1 §2.2):** **None first-party.** Browser 2030B
ships no currency, ledger, custody, lending, yield, or settlement features.
Third parties may build payment/financial features as extensions, web content,
or downstream forks; such Financial Functionality is **expressly permitted**
(§C.8) and is never disfavored by the *Riba* interpretive norm.

**Structural/technical safeguards that are the PRIMARY protection layer
(ML-1.1 §1.5 — this License is the fallback, not the first line):**

1. **Capability-based security** — every privileged operation requires an
   unforgeable, attenuable capability token; default-deny.
2. **Process/sandbox isolation** — engine, AI inference, and renderer run in
   separate, least-privilege processes.
3. **Default-deny networking & policy** (`admin/policy-engine`) — no implicit
   egress; explicit admin allow-lists.
4. **Post-quantum cryptography** (`engine/net`: X25519MLKEM768 / ML-DSA).
5. **Local-first AI with a redaction pipeline** (`ai/redaction`) — prompts are
   scrubbed before any non-local endpoint.
6. **Per-origin privacy budget** and state partitioning.

**Changes versus ML-1.1 (the table required by §E.6(c)):**

| Clause | Action vs. ML-1.1 | What & why | Foundational Principle served |
|--------|-------------------|------------|-------------------------------|
| Name / identifier | **Changed** | Distinct name "Browser 2030B License v1.0", id `LicenseRef-Browser2030B-1.0`; not represented as ML-1.1 | *Sidq* (§0.2, §E.6(c)) |
| §1.2 Foundational Principles | **Inherited unchanged** | Amanah, Sidq, Adl, Shafafiyah carried in full | all four |
| §1.3 Subsidiary norms incl. *Riba* | **Inherited unchanged** | Including the §1.3(iv) "interpretive value only" framing | *Adl*, *Sidq* |
| §1.5 Reinforcing-layer | **Inherited + tailored** | Names the six b2030b safeguards as the PRIMARY layer; license is fallback | *Sidq* |
| Part A (grants, attribution, termination) | **Inherited unchanged in substance** | §§3–10; "ML-1.1" reads "B2030B-1.0" | *Adl*, *Sidq* |
| Part B reciprocity | **Inherited + tailored** | File-level copyleft kept; §B.6 tailored to name `sync/server` + `cloud/wasm-edition` as the Network-Facing Works; §B.6.5 redaction carve-out kept | *Shafafiyah* |
| Part C ethical conditions | **Inherited, floor not lowered** | §C.0/§C.1 reinforcing character kept; added domain note §C.9 (browser-specific misuse) **as an addition, not a weakening** | *Darar*, *Zulm*, *Amanah*, *Sidq* |
| §C.8 Financial boundary | **Inherited + reproduced precisely** | Financial Functionality expressly permitted; reached only via §C.2–C.5 | *Adl*, *Sidq* |
| **§C.9 Browser-specific conditions** | **Added (stricter, allowed by §E.6(a))** | No purpose-built surveillance-ware / stalkerware / deceptive-UI builds | *Darar*, *Zulm*, *Sidq* |
| Part D (meta-license) | **Omitted (per §D.6)** | b2030b does not adjudicate other licenses; carrying D in adds surface without benefit | n/a (efficiency) |
| Part E stewardship | **Inherited + §E.6 honesty terms applied** | Versions immutable; ML-1.0 works stay ML-1.0 | *Amanah* |
| Part F general provisions | **Inherited unchanged in substance** | §§11–19; *sulh* dispute encouragement kept | *Adl* |

---

## PART 0 — DECLARATION AND CHARACTER

**0.1 Nature.** This is a **direct, source-available, ethical-source license**
governing the Browser 2030B Work. It is a **Derived License** under ML-1.1 §E.6.
It is **not** a meta-license: Part D of ML-1.1 is omitted per §D.6 because
Browser 2030B does not need to classify other licenses.

**0.2 Honest Labeling (a requirement, not a disclaimer — *Sidq*).** Browser
2030B is **not** "Open Source" (OSI) and **not** "Free Software" (FSF), and must
never be described as such. It imposes conditions on the *use* of the Work
(Part C), which the OSD (criteria 5–6) and the FSD (Freedom 0) forbid. Describe
it only as a *source-available, ethical-source license*. Concealing this would
itself breach *Sidq*.

**0.3 Source-Available classification.** The freedoms to read, study, modify,
and redistribute the Source Form are granted, subject only to Part C (ethical
use) and Part B (reciprocity). The License is *maximally permissive within
ethical bounds*.

---

## PART 1 — PRINCIPLES (inherited from ML-1.1 §1, operative)

**1.2 The Four Foundational Principles.** *Amanah* (trustworthy stewardship),
*Sidq* (honesty), *Adl* (justice/proportionality), *Shafafiyah* (transparency) —
adopted in full and unweakened. They are the interpretive key (§11).

**1.3 Subsidiary norms.** Prevention of *Darar* (harm), prohibition of *Zulm*
(oppression/exploitation), avoidance of *Gharar* (concealed essential terms),
and *Riba* — adopted exactly as in ML-1.1, **including** that *Riba* is an
**interpretive value only** that does not prohibit, condition, or disfavor any
lawful financial, monetary, or economic functionality. Any doubt about a
financial use is resolved **in favor of permission**.

**1.5 Reinforcing character (operative — *Sidq*).** The Ethical-Use Conditions
of Part C are a **reinforcing and remedial layer**, not a freestanding source of
novel prohibitions. Their primary legal effect is to ground **termination** and
to place violating use **outside the scope of the grant**. **No greater
enforceability is claimed than the law of the relevant forum allows.** For
Browser 2030B specifically, the **PRIMARY protection** is the set of structural
and technical safeguards enumerated in Part I (capabilities, sandboxing,
default-deny, PQC, redaction, privacy budget). This License is the fallback that
operates when those safeguards are absent, bypassed, or insufficient.

---

## PART 2 — DEFINITIONS

All defined terms of ML-1.1 §2 are incorporated by reference, including
**Network-Facing Work**, **Conveyed Copy Work**, **Corresponding Network
Source**, and **Financial Functionality**. For this Work:

- **"The Work"** means the first-party Browser 2030B source and artifacts in this
  repository (every file authored by the project). It does **not** include
  vendored upstream engines (Chromium/Blink, Gecko/SpiderMonkey) or third-party
  dependencies, which retain their own licenses.
- The **sync server** (`sync/server`) and **WASM cloud edition**
  (`cloud/wasm-edition`) are the components capable of being a **Network-Facing
  Work**; all other components are **Conveyed Copy Works** when shipped as a copy.

---

## PART A — DIRECT LICENSE TERMS (inherited from ML-1.1 Part A)

Sections **3 (Copyright grant)**, **4 (Patent grant incl. defensive
termination)**, **5 (Trademark clarification)**, **6 (Attribution & notices —
*Sidq*)**, **7 (Warranty disclaimer)**, **8 (Limitation of liability)**, **9
(Termination — *Adl*, incl. the 30-day first-breach cure in §9.2 and the
non-curable-breach rule in §9.3)**, and **10 (No waiver)** are adopted from
ML-1.1 **unchanged in substance**, reading "ML-1.1" as "B2030B-1.0".

**§5 (Trademark), as applied:** the name "Browser 2030B" and the codename
"b2030b" are **reserved** and are **not** licensed hereunder. Descriptive
("based on Browser 2030B") use is permitted; use implying endorsement is not.

---

## PART B — RECIPROCITY AND DISTRIBUTION

**B.1–B.5, B.7** are adopted from ML-1.1 unchanged in substance: file-level
reciprocity (modified Work files stay under this License with Source Form
available — B.3), Larger-Work combination permitted (B.4), **non-severability of
the Ethical-Use Conditions** (B.5 — Part C travels with the Work and may not be
stripped), and downstream-recipient binding (B.7).

### B.6 Network Use (tailored per ML-1.1 §B.6, scope by objective test)

**B.6.1 Trigger.** Applies **only** to a **Network-Facing Work**. For Browser
2030B this means a deployment of the **sync server** or the **WASM cloud
edition** (or a modified portion thereof) whose **principal means of delivering
value to remote users is their remote interaction with that functionality**.
Whether a deployment qualifies is decided by this **objective test**, and **does
not depend on any ruling, guidance, or classification by any Steward.**

**B.6.2 Obligation.** If You operate a **modified** Network-Facing Work and make
its functionality available to remote users, You must offer those users access
to the **Corresponding Network Source** of the version as actually deployed,
under this License, by a means no more burdensome than how You provide the
functionality (e.g. a conspicuous link in the UI or a documented endpoint). The
offer must remain available while You provide the functionality and for **30
days** thereafter.

**B.6.3 Express exclusions (*Adl*).** No source-provision duty arises for: (a) a
**Conveyed Copy Work** — i.e. the shipped browser, desktop installers, mobile
apps, and engine copies (governed by B.2 only); (b) internal deployments not
offered to third-party remote users; (c) **unmodified** upstream already public
under this License; or (d) supportive backend/auxiliary infrastructure that is
not itself the Network-Facing Work and contains no modified value-delivering
portion of the Work.

**B.6.4 No hidden defeat of transparency.** You may not restructure a deployment
for the principal purpose of evading B.6.2 while still delivering the Work's
value to remote users (a *Shafafiyah* circumvention; see B.5 and §9).

**B.6.5 Operational-secret carve-out.** B.6.2 concerns *source code* only. It
does **not** require disclosure of private keys, user data, credentials, or
operational secrets whose disclosure would create *Darar* or breach *Amanah*.
The duty is satisfied by providing the Corresponding Network Source with such
genuinely sensitive secrets **redacted**, provided the redaction does not defeat
a recipient's ability to study, build, and run an equivalent version.

---

## PART C — ETHICAL-USE CONDITIONS

**C.0 Legal character (reinforcing — read with §1.5).** The Conditions below are
**conditions of the license grant**: violating use falls outside the rights
granted in Part A. As to conduct already unlawful (fraud, trafficking, unlawful
harm), this Part is **declaratory and reinforcing** — its operative effect is to
let the Licensor **terminate** (§9) and treat continued use as outside scope —
**not** to invent new prohibitions enforceable only by virtue of this License.
No enforceability is claimed beyond what the forum's law independently allows;
the rest of the License does not depend on any one Condition being independently
enforceable (§C.7, §14).

**C.1 Status.** Part A rights are granted **only on condition** that the Work is
not used as prohibited here, read together with §C.0 and §1.5.

**C.2 No deception or fraud (*Sidq*).** The Work may not be used to deceive,
defraud, or misinform — e.g. phishing kits, fraudulent-provenance tooling,
deceptive credential capture.

**C.3 No unlawful harm to persons (*Darar*).** The Work may not be purpose-built
to inflict unlawful physical, psychological, or material harm.

**C.4 No oppression or exploitation (*Zulm*).** The Work may not be an instrument
of forced labor, trafficking, unlawful discrimination, or systematic
exploitation of vulnerable persons.

**C.5 No betrayal of trust (*Amanah*).** The Work may not be used to abuse
privileged access or exfiltrate data one was entrusted to protect.

**C.6 Construction (knowledge standard).** Conditions are construed reasonably
and in good faith by the Foundational Principles; they target **purpose-built
misuse** and **knowing facilitation**; the standard is **actual knowledge or
willful blindness**, never negligence. Ordinary lawful good-faith use is never a
breach. (Inherited unchanged from ML-1.1 §C.6.)

**C.7 Severability of applications.** If a court holds a particular *application*
of a Condition unenforceable, other applications and the remaining Conditions
continue in full force. (Inherited unchanged.)

**C.8 Financial Functionality — express boundary (reproduced from ML-1.1 §C.8).**

- **C.8.1 General permission.** Providing, operating, and ordinary lawful use of
  Financial Functionality — currency, ledgers, payments, settlement, exchanges,
  markets, custody, accounting, lending, borrowing, credit, and interest-,
  yield-, or demurrage-bearing instruments — is **expressly permitted** and is
  **not** a breach of any Condition.
- **C.8.2 The only financial limits.** Financial Functionality is reached by this
  Part **solely** where it independently and squarely constitutes **fraud** (§C.2),
  **unlawful harm** (§C.3), **exploitation of the vulnerable** (§C.4, e.g.
  predatory entrapment), or **breach of trust** (§C.5, e.g. misappropriating
  custodied funds). **No** financial activity is prohibited *merely* because it
  bears interest, yield, demurrage, or profit, or might be characterized as
  *riba*.
- **C.8.3 Interpretive supremacy of permission.** In any doubt about Financial
  Functionality, **permission prevails**. The *Riba* norm shall never be invoked
  to declare a financial Work or its ordinary lawful operation non-compliant.

**C.9 Browser-specific conditions (ADDED — stricter, permitted by ML-1.1
§E.6(a); does not lower the Part C floor).** Consistent with *Darar*, *Zulm*,
and *Sidq*, and subject in full to the **actual-knowledge-or-willful-blindness**
standard of §C.6 and the reinforcing character of §C.0/§1.5, the Work may not be
**purpose-built** to:

- **(a)** operate as **stalkerware / covert surveillance-ware** that monitors a
  person without their knowledge or lawful authority (*Darar*, *Amanah*);
- **(b)** present **deceptive user interfaces** designed to trick users about
  security state, identity, or provenance — e.g. forging the omnibox security
  indicator or C2PA provenance badges (*Sidq*);
- **(c)** systematically **circumvent the capability/permission and privacy-
  budget safeguards** in order to exfiltrate user data contrary to the user's
  reasonable expectation (*Amanah*, *Zulm*).

For the avoidance of doubt, §C.9 reaches only **knowing, purpose-built** misuse;
building security-research, accessibility, parental-consent, or
lawful-enterprise-management tooling in good faith is **never** a breach. Where
the conduct in §C.9 is already unlawful, §C.9 is declaratory and reinforcing per
§C.0.

---

## PART D — META-LICENSE

**Omitted** per ML-1.1 §D.6. Browser 2030B does not classify other licenses, so
carrying the meta-license machinery would add surface area without benefit. This
omission is **compliant** with, and **not** a deviation from, ML-1.1.

---

## PART E — STEWARDSHIP & VERSIONING

**E.1–E.5** adopted from ML-1.1 unchanged in substance: published versions are
**immutable** (do not edit `LICENSE-ML-1.1.md` or this file's published text); a
Work names a specific version unless it adopts "or any later version"; the base
text's canonical source governs its meaning.

**E.6 compliance (this Derived License).** This License (a) adopts ML-1.1's
Foundational Principles, Parts A/B/C/E/F, and does **not** weaken the Part C
floor (it only **adds** §C.9); (b) omits Part D (§D.6) and tailors §B.6 **without
eliminating** the source-availability guarantee or the network-transparency
principle; (c) honestly and conspicuously states it is "based on Maher's License,
Version 1.1," identifies its additions/omissions (Part I), carries its **own
distinct name and identifier**, and does **not** claim to be ML-1.1 or to hold
any approval it lacks; and (d) preserves honest labeling (§0.2) and the
reinforcing-layer acknowledgment (§1.5, §C.0).

---

## PART F — GENERAL PROVISIONS (inherited from ML-1.1 Part F)

Sections **11 (Interpretation by the Foundational Principles)**, **12 (Conflict
with mandatory law — mandatory law prevails; no unlawful act is authorized)**,
**13 (Governing law & disputes, incl. *sulh* / amicable-settlement
encouragement)**, **14 (Severability with reform-rather-than-strike)**, **15
(Entire agreement; Parts read as 0,1,2,A,B,C,E,F here — D omitted)**, **16 (No
agency or endorsement)**, **17 (Independence from external bodies)**, **18
(Language & translations)**, and **19 (Acceptance)** are adopted from ML-1.1
unchanged in substance, reading "ML-1.1" as "B2030B-1.0".

---

## PART X — REVIEW CHECKLIST (the 8 mandatory constraints of the ML-1.1 PROMPT)

| # | Mandatory constraint (ML-1.1 PROMPT) | Satisfied by | Status |
|---|--------------------------------------|--------------|--------|
| 1 | Inherit & do not weaken §1.2, Parts A/B/C/E/F; may add stricter terms | Parts 1, A, B, C, E, F; §C.9 added, floor not lowered | ✅ |
| 2 | Omit Part D unless genuinely needed | Part D omitted per §D.6 (b2030b does not adjudicate licenses) | ✅ |
| 3 | Resolve network-use scope by objective test, not Steward ruling; keep §B.6.5 carve-out | §B.6.1 objective test names sync server + WASM cloud; §B.6.5 redaction carve-out kept | ✅ |
| 4 | If Financial Functionality present, reproduce/tailor §C.8; resolve doubt to permission; remove *Riba* contradiction | §1.3, §C.8.1–C.8.3 reproduced; permission prevails; (none first-party, but enabled for downstream) | ✅ |
| 5 | Be honest about enforcement layer (§C.0, §1.5); name structural safeguards as PRIMARY; no overclaim | §1.5 names the 6 b2030b safeguards as PRIMARY; §C.0 reinforcing/declaratory; no greater enforceability claimed | ✅ |
| 6 | Preserve honest labeling (§0.2); own distinct name + LicenseRef; not represented as ML-1.1/approved | §0.2; `LicenseRef-Browser2030B-1.0`; §E.6 honesty terms | ✅ |
| 7 | Keep actual-knowledge-or-willful-blindness; no negligence liability | §C.6 inherited; §C.9 expressly subject to §C.6 | ✅ |
| 8 | Application-specific severability (§C.7) + general reform-rather-than-strike (§14) | §C.7 + §F/§14 | ✅ |

---

## PART R — RISK & UNCERTAINTY NOTE (clauses needing human review)

The following warrant review by a **qualified human attorney** in the relevant
forum and, where the *fiqh* grounding is material, a **Shariah board**:

1. **§C.0 / §1.5 enforcement-layer framing.** Whether a court treats Part C as a
   true scope-of-grant limitation (reachable as infringement) versus a mere
   covenant varies by jurisdiction (cf. U.S. copyright "condition vs. covenant"
   case law). The draft deliberately **does not overclaim**; confirm the framing
   holds in your forum.
2. **§B.6 network-use obligation.** The objective Network-Facing-Work test is
   novel relative to AGPL §13. Confirm the §B.6.1 test and §B.6.5 redaction
   carve-out are enforceable and unambiguous for your sync-server / cloud-edition
   deployments.
3. **§C.9 browser-specific additions.** Confirm "purpose-built stalkerware /
   deceptive-UI / safeguard-circumvention" prohibitions are drafted narrowly
   enough (with the §C.6 knowledge standard) to avoid chilling lawful security
   research, accessibility, or enterprise-management use.
4. **§C.8 financial boundary.** Confirm the *Riba*-permission framing is
   internally consistent and that no latent contradiction re-enters via §C.9.
5. **Trademark reservation (§5).** Confirm the "Browser 2030B" / "b2030b" marks
   are properly reserved and the descriptive-use boundary is clear in your
   jurisdiction.
6. **Bracketed Steward/Registry/jurisdiction fields** in Exhibit 1 should be
   completed before any formal publication.

**Adversarial re-read (per the PROMPT's final instruction).** Confirmed the draft
does **not**: (a) recreate the *Riba* contradiction (§1.3(iv) + §C.8 resolve to
permission); (b) leave network-use scope dependent on a Steward ruling (§B.6.1
objective test); (c) overclaim Part C enforceability (§C.0/§1.5 disclaim it);
(d) cargo-cult Part D (omitted per §D.6).

---

## EXHIBIT 1 — NOTICE FOR APPLYING B2030B-1.0 TO A FILE/WORK

> Copyright (c) 2026 Maher and the Browser 2030B contributors.
>
> This Work is licensed under **The Browser 2030B License, Version 1.0
> (B2030B-1.0)**, a *source-available, ethical-source* license **based on
> Maher's License, Version 1.1 (ML-1.1)**. This is **not** an OSI "open source"
> or FSF "free software" license; it imposes ethical conditions on use (Part C).
> You may use, study, modify, and distribute this Work under B2030B-1.0. If You
> operate a **modified, network-facing** deployment of the sync server or WASM
> cloud edition, see §B.6 (network source availability). **Financial
> functionality is expressly permitted (§C.8).** The base license text is in
> `LICENSE-ML-1.1.md`; this Derived License is in `LICENSE-Browser2030B-1.0.md`.
>
> Licensed under B2030B-1.0 "Version 1.0 or any later version."
> Governing law / forum: [to be designated by the Licensor]
>
> THE WORK IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. SEE §§7–8.

## EXHIBIT 2 — SPDX-STYLE IDENTIFIER

> Self-assigned identifier (pending any external recognition): `LicenseRef-Browser2030B-1.0`
> Full name: The Browser 2030B License, Version 1.0
> Based on: Maher's License, Version 1.1 (`LicenseRef-Maher-1.1`)
> Category: Ethical Source; Source-Available; Derived License (Part D omitted)
> Base license text: LICENSE-ML-1.1.md
