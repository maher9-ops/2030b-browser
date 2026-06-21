# admin/mdm-connectors

Maps platform Mobile Device Management (MDM) channels onto signed Browser 2030B
policy bundles (build brief §7, §5.20). Every inbound policy is normalized to a
bundle validated against the JSON Schemas in `admin/schemas/` and verified for
dual signatures (Ed25519 + ML-DSA-65) before load.

| Connector | Platform mechanism | Notes |
|-----------|--------------------|-------|
| `gpo/` | Windows Group Policy (ADMX/ADML templates) | Maps registry-backed policies |
| `intune/` | Microsoft Intune (Settings Catalog / OMA-URI) | Cloud MDM push |
| `jamf/` | Apple Jamf / Configuration Profiles (`.mobileconfig`) | macOS/iOS |
| `https-pull/` | Generic signed-JSON over HTTPS | Self-hosted MDM |

## ADMX template (excerpt)

```xml
<policy name="DohProvider" class="Machine"
        displayName="$(string.DohProvider)"
        key="Software\Policies\B2030B" valueName="DohProvider">
  <parentCategory ref="Network"/>
  <supportedOn ref="SUPPORTED_B2030B_1_0"/>
  <elements><text id="DohProvider_Text" valueName="DohProvider"/></elements>
</policy>
```

## Generic HTTPS pull

The browser polls a configured URL over **Oblivious HTTP** (no IP correlation),
downloads the signed bundle, verifies both signatures, validates against the
schemas, then hot-reloads and broadcasts the effective-policy diff.
