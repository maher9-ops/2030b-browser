# iOS App Store package (.ipa)

Archive and export a signed IPA for the iOS app (built on the Swift 6 core in
`mobile/ios`). Runs on macOS runners with Xcode and a valid signing identity.

```sh
xcodebuild -scheme Browser2030B \
  -configuration Release \
  -archivePath build/Browser2030B.xcarchive \
  archive

xcodebuild -exportArchive \
  -archivePath build/Browser2030B.xcarchive \
  -exportOptionsPlist packaging/ios-ipa/ExportOptions.plist \
  -exportPath build/ipa
```

## Notes
- Signing is automatic via `ExportOptions.plist`; `DEVELOPMENT_TEAM` is injected
  from CI secrets and never committed.
- `Info.plist` declares no `NS*UsageDescription` beyond what the default-deny
  model needs; capabilities are requested on demand after user consent.
