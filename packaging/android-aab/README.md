# Android App Bundle (.aab)

Produce a signed Play-ready bundle from the Kotlin app in `mobile/android`.

```sh
# Requires Android SDK 35 + the upload keystore (provided via CI secrets).
./gradlew :mobile:android:bundleRelease

# Output:
#   mobile/android/build/outputs/bundle/release/android-release.aab

# Sign with the upload key (CI does this with bundletool / jarsigner):
jarsigner -keystore "$UPLOAD_KEYSTORE" \
  -storepass "$KEYSTORE_PASS" \
  android-release.aab "$KEY_ALIAS"
```

## Notes
- `isMinifyEnabled` + `isShrinkResources` are on for release (see
  `mobile/android/build.gradle.kts`).
- Signing keys are never committed; CI injects them from the secret store.
- The manifest declares only `INTERNET`; sensitive permissions are requested at
  runtime per the default-deny `SecurityPolicy`.
