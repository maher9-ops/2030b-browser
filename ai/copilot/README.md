# ai/copilot — AI Copilot Sidebar

The multi-model assistant (forward feature §9.1). It runs in the dedicated **AI
inference process** (see `docs/00-architecture.md` §2.1) and is wired to the UI
side panel (`ui/shell-desktop/src/side-panel.ts`).

## Default model

A **bundled local 8B-class instruction-tuned model** (see
`ai/local-models/README.md`). Cloud providers are **off by default** and only
enabled by the AI & Data admin policy domain with explicit allowed endpoints.

## Capabilities

- Page-context awareness (reads the active tab's accessible content).
- Multi-tab comparison and summarization.
- Drafting and rewriting.
- On-device translation hand-off.

## Privacy guarantees

1. Every prompt passes through [`ai/redaction`](../redaction/) before it can
   reach any non-local endpoint.
2. Sites on the `noAiSites` policy list are never sent to any model.
3. `modelOutputLogging` policy controls whether outputs are logged (default off).

## Process boundary

The copilot process holds only an `AiObserve` / `AiLocal` capability (see
`engine/ipc`); calling a remote endpoint additionally requires an `AiRemote`
capability minted only when the AI & Data policy allows the specific endpoint.
