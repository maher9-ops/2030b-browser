# Browser 2030B — iOS / macOS

Swift 6 package (strict concurrency, warnings-as-errors) providing the pure
browser core. The Xcode project adds UIKit (iOS) / AppKit (macOS) host targets
and embeds WKWebView or the vendored engine per policy.

## Build & test

```sh
cd mobile/ios
swift build            # builds Browser2030BCore
swift test             # SecurityPolicy + TabModel unit tests (no UI needed)
```

## Design

- **Default-deny:** `SecurityPolicy` denies every `Capability` until an
  unexpired allow grant from an equal-or-higher `PolicyLayer`
  (Enterprise > LocalAdmin > User > Default) is recorded — identical semantics
  to the Rust engine and the Android edition.
- **Sendable everywhere:** the core compiles under Swift 6 strict concurrency.
- The core has no UIKit/WebKit dependency, so `swift test` runs on any platform
  with a Swift 6 toolchain (CI uses macOS runners).
