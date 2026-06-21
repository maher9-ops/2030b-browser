# Ethical-Use Conditions — Browser 2030B

Browser 2030B (`b2030b`) first-party code is licensed under **The Browser 2030B
License v1.0 (B2030B-1.0)** — a **source-available, ethical-source** *Derived
License* based on **Maher's License v1.1 (ML-1.1)**. It places **non-severable
Ethical-Use Conditions** on use of the Work (Part C). This file is a
plain-language summary; the **binding texts** are the Derived License
[`LICENSE-Browser2030B-1.0.md`](LICENSE-Browser2030B-1.0.md) and the base
[`LICENSE-ML-1.1.md`](LICENSE-ML-1.1.md). Where this summary differs from those,
the license texts govern.

> **Honest labeling (§0.2).** B2030B-1.0 / ML-1.1 are **not** OSI "open source"
> or FSF "free software" licenses. Describe them only as *source-available,
> ethical-source* licenses. Misrepresenting them would itself breach *Sidq*.

## The four Foundational Principles (§1.2)

| Principle      | Meaning      | What it requires of users of b2030b                                  |
| -------------- | ------------ | -------------------------------------------------------------------- |
| **Amanah**     | Trust        | Honour the trust placed in software stewardship; do not betray users.|
| **Sidq**       | Honesty      | No deception, no fraud, truthful attribution and notices.            |
| **Adl**        | Justice      | Treat parties fairly; remedies and termination are proportionate.    |
| **Shafafiyah** | Transparency | Be open about what the software does and how it is used.             |

Subsidiary norms (§1.3): avoid **Darar** (harm), **Zulm** (oppression /
exploitation), **Gharar** (concealment of essential terms). **Riba** is an
**interpretive value only** — see "Financial functionality" below.

## The Ethical-Use Conditions are a *reinforcing layer* (§C.0, §1.5)

This is important and honest: the conditions below are a **reinforcing and
remedial** layer, **not** a freestanding set of new prohibitions. Their main
legal effect is to let the Licensor **terminate** the grant and place violating
use **outside the scope** of the license. **No greater enforceability is claimed
than the law of your forum allows.**

The **PRIMARY protection** for Browser 2030B is its **structural and technical
safeguards** — capability-based security, process/sandbox isolation,
default-deny networking and policy, post-quantum cryptography, the AI redaction
pipeline, and the per-origin privacy budget. The license is the **fallback** for
when those safeguards are absent, bypassed, or insufficient. Build the
safeguards first; rely on the license second.

## What you may NOT do with this software (Part C)

Using the Work is conditioned on **not** using it to (knowingly, or with willful
blindness — the §C.6 standard; ordinary good-faith use is never a breach):

1. **Deceive or defraud** people (§C.2 — *Sidq*).
2. **Unlawfully harm** persons (§C.3 — *Darar*).
3. **Oppress or exploit** people (§C.4 — *Zulm*), especially the vulnerable.
4. **Betray a trust** placed in you (§C.5 — *Amanah*).

**Browser-specific additions (§C.9 — stricter terms allowed by ML-1.1 §E.6(a),
subject to the same §C.6 knowledge standard).** The Work may not be
**purpose-built** to: (a) act as **stalkerware / covert surveillance-ware**;
(b) present **deceptive UIs** that forge security or provenance indicators (e.g.
faking the omnibox lock or C2PA badge); or (c) systematically **circumvent the
capability/permission and privacy-budget safeguards** to exfiltrate user data.
Good-faith security research, accessibility, parental-consent, and lawful
enterprise-management tooling are **never** a breach.

These conditions are **non-severable** from the grant (§B.5) and travel to every
downstream recipient. If a particular *application* is held unenforceable, only
that application is severed; the rest stand (§C.7, §14).

## Financial functionality is EXPRESSLY PERMITTED (§C.8)

Browser 2030B ships no first-party financial features, but the license makes the
boundary explicit: providing and using **Financial Functionality** — currency,
ledgers, payments, settlement, exchanges, custody, lending, borrowing, credit,
and interest-, yield-, or demurrage-bearing instruments — is **expressly
permitted** and is **never** a breach merely because it bears interest/yield or
might be characterized as *riba*. Financial activity is reached **only** if it
independently constitutes fraud (§C.2), unlawful harm (§C.3), exploitation of
the vulnerable (§C.4), or breach of trust (§C.5). **Any doubt resolves in favor
of permission.** So you may freely build payment or financial extensions/web
apps on b2030b.

## Reciprocity, source & network use (Part B)

- **File-level copyleft (§B.3):** modify a Work file → it stays under B2030B-1.0
  and you must make its source available.
- **Larger works (§B.4):** you may combine b2030b with separately-licensed
  components; the Work's files keep their terms.
- **Network use (§B.6) — narrow and objective:** applies **only** to a
  **modified** deployment of the **sync server** (`sync/`) or **WASM cloud
  edition** (`cloud/wasm-edition`) whose value is delivered principally by remote
  interaction. Then you must offer remote users the **Corresponding Network
  Source** of the deployed version. The shipped **browser, installers, mobile
  apps, and engine copies are Conveyed Copy Works** with **no** network-source
  duty. Operational secrets, private keys, and user data may be **redacted**
  (§B.6.5).

## Attribution (§6 — *Sidq*)

Preserve copyright, license, and ethics notices. Do not misattribute authorship.
Keep the `LicenseRef-Browser2030B-1.0` SPDX identifier on first-party files.

## Termination & cure (§9 — *Adl*)

Violations can terminate your rights, but via a proportionate, just process
(30-day first-breach cure in §9.2; non-curable-breach rule in §9.3). Disputes are
encouraged toward amicable settlement (*sulh*, §13).

## Reporting concerns

Suspected ethical-use violations or licensing questions: open a confidential
report per [`SECURITY.md`](SECURITY.md), or contact the maintainers. See
[`docs/10-licensing-and-ethics.md`](docs/10-licensing-and-ethics.md) for how the
license maps onto this repository and the dependency compatibility review.
