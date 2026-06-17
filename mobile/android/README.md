# Browser 2030B — Android

Kotlin (K2 compiler) application embedding the vendored GeckoView engine.

## Build

```sh
# Requires Android SDK 35 + the vendored GeckoView AAR (fetched by ./bootstrap).
./gradlew :mobile:android:assembleRelease   # -> AAB/APK under build/outputs
./gradlew :mobile:android:testDebugUnitTest # JVM unit tests (SecurityPolicy)
```

## Design

- **Default-deny:** `SecurityPolicy` denies every capability until an explicit,
  unexpired grant from an equal-or-higher policy layer is recorded
  (Enterprise > LocalAdmin > User > Default), mirroring the Rust engine.
- **Manifest minimalism:** only `INTERNET` is declared statically; camera, mic,
  and location are requested on demand, per origin, after user consent.
- The Activity is intentionally thin — all gating logic lives in the unit-tested
  `SecurityPolicy` model.
