# ai/local-models — Bundled On-Device Models

All models here run **fully on-device** in the AI inference process. No content
leaves the device. Models are fetched (not committed) by `./bootstrap` from a
pinned, signed manifest and verified by digest.

| Model | Purpose | Spec |
|-------|---------|------|
| `copilot-8b` | Default copilot assistant (8B-class, instruction-tuned) | `copilot.md` |
| `safe-browsing` | Local-first phishing/malware URL classifier (no URL exfiltration) | `safe_browsing.md` |
| `translation` | 100+ language on-device translation, downloadable packs | `translation.md` |
| `captions` | Live captions for any media | `captions.md` |
| `spellcheck` | Spell + grammar check, 60+ languages | `spellcheck.md` |

## Format & runtime

- Quantized GGUF / ONNX, executed via the WebNN-backed inference runtime.
- Per-model digests pinned in `models.lock`.
- Inference is sandboxed: no network capability unless the AI & Data policy
  explicitly opens a remote endpoint (which uses a *different* model path).
