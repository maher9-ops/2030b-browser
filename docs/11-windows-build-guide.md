# 11 — Windows Developer Setup & Export Guide

A complete, copy-paste **step-by-step guide** for setting up a fresh **Windows
10/11 (x64)** laptop to build and **export every Browser 2030B (`b2030b`)
software artifact**: the Rust engine workspace, the TypeScript UI bundles, the
Tauri desktop app, the desktop installers (MSI / NSIS), and the cross-platform
mobile artifacts you can drive from Windows (Android AAB/APK; iOS notes).

> **License note (ML-1.0).** Everything you build here is Browser 2030B
> first-party code under **Maher's License v1.0 (ML-1.0)** — a
> *source-available, ethical-source* license, **not** OSI "open source" / FSF
> "free software". Vendored engines (Chromium/Gecko) keep their own upstream
> licenses. See [`../LICENSE`](../LICENSE), [`../ETHICS.md`](../ETHICS.md), and
> [`10-licensing-and-ethics.md`](10-licensing-and-ethics.md) before redistributing.

---

## 0. What you will be able to export

| Artifact | Tooling needed | Output |
| --- | --- | --- |
| Rust engine + crates (release) | Rust 1.82 (MSVC) | `target\release\*.exe`, `*.lib`, `*.dll` |
| TypeScript UI bundles | Node 20 + Yarn | `ui\*\dist\` |
| Desktop app (Tauri) | Rust + Node + WebView2 | `Browser 2030B.exe` |
| Windows installer (MSI) | + WiX Toolset | `*.msi` |
| Windows installer (NSIS) | + NSIS | `*-setup.exe` |
| Android app bundle (AAB/APK) | + JDK 17 + Android SDK/NDK | `*.aab`, `*.apk` |
| iOS app (IPA) | **macOS + Xcode only** (not Windows) | see §9 |
| WASM cloud edition | Rust `wasm32` target | `cloud\wasm-edition\dist\` |

**Time/space budget:** a *full* build with the from-source Chromium engine needs
**~80–120 GB free** + 16 GB RAM. **Without** the vendored engine fetch (the
recommended path — the engine integration crates compile against vendoring
shims), the whole thing fits in **~15 GB** and builds on modest hardware.

> ### ⚠️ Reading this on an 8 GB RAM / 70 GB free laptop? Start here.
> Your machine **cannot** do the full from-source Chromium build (it alone wants
> ~100 GB of disk and lots of RAM). **That's fine** — you can still build and
> export *every b2030b first-party artifact* (engine crates, UI, the Tauri
> desktop app, MSI/NSIS installers, the WASM cloud edition, and Android) on
> 8 GB / 70 GB by following the **constrained-build path in §A** below. Do
> §1–§4 normally, then jump to **§A** instead of doing a full release LTO build.
> Always use `.\bootstrap.ps1 -NoEngine` (skip the optional Chromium fetch).

---

## 1. Prerequisites & system prep

1. **Windows 10 21H2+ or Windows 11**, 64-bit.
   - **For the constrained path (§A):** **8 GB RAM and ~70 GB free** is enough.
     Close other apps while linking; see §A for the low-memory cargo profile.
   - **For a full from-source Chromium engine build:** 16 GB RAM minimum (32 GB
     recommended) and ~100 GB free — **not** feasible on an 8 GB / 70 GB laptop;
     use the constrained path instead.
   - An **SSD** is strongly recommended (the linker is I/O-heavy).
2. **Run PowerShell as Administrator** for the install steps (Start → type
   *PowerShell* → right-click → *Run as administrator*).
3. **Enable script execution** (one time, current user):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
4. **Enable long paths** (Rust + Chromium need this):
   ```powershell
   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
     -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
   ```
5. **Install a package manager — winget (built into Win 11 / modern Win 10)**.
   Verify: `winget --version`. If missing, install **App Installer** from the
   Microsoft Store. (Chocolatey is an acceptable alternative; commands below
   give the winget form.)

---

## 2. Install the toolchain (the "download & install" list)

Run these in the **Administrator PowerShell**. Each item lists *what it is* and
*why b2030b needs it*.

### 2.1 Git (source control)
```powershell
winget install --id Git.Git -e --source winget
```

### 2.2 Visual Studio Build Tools 2022 — **MSVC C++ + Windows SDK** (required by Rust MSVC and Tauri)
Download: <https://visualstudio.microsoft.com/downloads/> → *Tools for Visual
Studio* → **Build Tools for Visual Studio 2022**. Or via winget:
```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools -e
```
**During the installer, you MUST check these workloads/components:**
- ✅ **Desktop development with C++**
- ✅ **MSVC v143 - VS 2022 C++ x64/x86 build tools**
- ✅ **Windows 11 SDK** (or Windows 10 SDK 10.0.19041+)
- ✅ **C++ CMake tools for Windows**

> Rust's default Windows toolchain targets `x86_64-pc-windows-msvc`, which links
> with the MSVC linker. Without these, `cargo build` fails with `link.exe not
> found`.

### 2.3 Rust 1.82 via rustup (engine + Tauri backend)
```powershell
winget install --id Rustlang.Rustup -e
# New shell, then pin the toolchain the repo expects:
rustup toolchain install 1.82
rustup default 1.82
rustup component add rustfmt clippy rust-src
# Targets used for cross/export builds:
rustup target add x86_64-pc-windows-msvc aarch64-pc-windows-msvc wasm32-unknown-unknown
```
The repo's [`../rust-toolchain.toml`](../rust-toolchain.toml) pins channel
`1.82` and these targets, so rustup will auto-sync when you `cd` into the repo.

### 2.4 Node.js 20 LTS + Corepack/Yarn (TypeScript UI)
```powershell
winget install --id OpenJS.NodeJS.LTS -e
# New shell:
corepack enable        # provides Yarn (the repo uses Yarn workspaces)
corepack prepare yarn@stable --activate
node --version          # expect v20.x
yarn --version
```

### 2.5 WebView2 Runtime (Tauri desktop renderer)
Usually preinstalled on Win 11. Install/repair to be safe:
```powershell
winget install --id Microsoft.EdgeWebView2Runtime -e
```

### 2.6 WiX Toolset v3 — **MSI installer export**
```powershell
winget install --id WiXToolset.WiXToolset -e
# If winget lacks it, download WiX 3.14 from https://wixtoolset.org/releases/
```
Used by `packaging\windows-msi\b2030b.wxs` and Tauri's `msi` bundler.

### 2.7 NSIS — **`-setup.exe` installer export** (Tauri `nsis` target)
```powershell
winget install --id NSIS.NSIS -e
```

### 2.8 LLVM/Clang (bindgen for some native crates)
```powershell
winget install --id LLVM.LLVM -e
# Tell bindgen where libclang is (adjust version path if needed):
setx LIBCLANG_PATH "C:\Program Files\LLVM\bin"
```

### 2.9 (Optional) Bazel via Bazelisk — only if you use the Bazel build graph
```powershell
winget install --id Bazel.Bazelisk -e
```

### 2.10 Android toolchain — **only if you want to export Android AAB/APK**
1. **JDK 17 (Temurin):**
   ```powershell
   winget install --id EclipseAdoptium.Temurin.17.JDK -e
   ```
2. **Android Studio** (gives you the SDK manager + emulator):
   ```powershell
   winget install --id Google.AndroidStudio -e
   ```
3. Open Android Studio → **SDK Manager** and install:
   - **Android SDK Platform 34** (and 35 if available)
   - **Android SDK Build-Tools 34.x**
   - **Android SDK Platform-Tools**
   - **NDK (Side by side)** — required for the Rust `aarch64-linux-android`
     native lib
   - **CMake**
4. Set environment variables (adjust the path to your user name):
   ```powershell
   setx ANDROID_HOME "$env:LOCALAPPDATA\Android\Sdk"
   setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-17*"
   # Add to PATH: %ANDROID_HOME%\platform-tools and %ANDROID_HOME%\cmdline-tools\latest\bin
   ```
5. Add the Rust Android target:
   ```powershell
   rustup target add aarch64-linux-android armv7-linux-androideabi
   ```

> **iOS note:** Apple does not allow iOS/IPA builds on Windows. See §9.

### 2.11 Restart your shell
Close and reopen PowerShell (or sign out/in) so all `PATH`/`setx` changes take
effect. Verify the core tools:
```powershell
git --version; rustc --version; cargo --version; node --version; yarn --version
```

---

## 3. Get the source

```powershell
cd $HOME\dev   # or wherever you keep code; create it if needed
git clone https://github.com/maher9-ops/2030b-browser.git
cd 2030b-browser
```

> First-party code is under **B2030B-1.0** (`LicenseRef-Browser2030B-1.0`), the
> Derived License based on **ML-1.1**. By building and especially by
> **redistributing** any artifact, you accept the Ethical-Use Conditions in
> [`../ETHICS.md`](../ETHICS.md). Note: if you deploy a *modified* sync server or
> WASM cloud edition to remote users, the §B.6 network-source duty applies.

---

## 4. Bootstrap & verify the environment

The repo ships a PowerShell bootstrap that checks/installs missing pieces and
syncs the pinned Rust toolchain:

```powershell
# Verify only (installs nothing):
.\bootstrap.ps1 -Check

# Full bootstrap WITHOUT the multi-GB engine fetch (recommended first run):
.\bootstrap.ps1 -NoEngine
```

`-NoEngine` skips the optional ~100 GB Chromium/Gecko source. You can build and
export everything **except** a from-source engine rebuild without it (the engine
integration crates compile against vendoring shims).

---

## §A. Constrained-build path — 8 GB RAM / 70 GB free (READ IF THAT'S YOU)

This section is the **complete recipe for a low-spec laptop**. Follow it instead
of the "release LTO" parts of §5/§7. Everything here produces real, shippable
artifacts; the only thing you give up is the from-source Chromium rebuild (which
needs ~100 GB and 16 GB+ RAM — not your machine).

### A.1 Disk plan for 70 GB free
| Consumer | Approx. size |
| --- | --- |
| VS Build Tools + Windows SDK | ~8–10 GB |
| Rust toolchain + targets | ~2 GB |
| Node + Yarn + UI `node_modules` | ~1–2 GB |
| `target\` (debug + a thin-LTO release) | ~6–12 GB |
| Tauri build + MSI/NSIS output | ~2–3 GB |
| Android Studio + one SDK/NDK (optional) | ~12–15 GB |
| **Headroom you should keep free** | **≥ 10 GB** |

➡️ **Never run the Chromium fetch.** Always `.\bootstrap.ps1 -NoEngine`. If you
installed Android Studio and are tight on space, you can uninstall it after you
have exported your `.aab`/`.apk`.

### A.2 Add 8–16 GB of swap (pagefile) before linking
On 8 GB RAM the **release linker** for the workspace is the step most likely to
fail with out-of-memory. Give Windows a large pagefile:

1. *Settings → System → About → Advanced system settings → Performance →
   Settings → Advanced → Virtual memory → Change…*
2. Uncheck "Automatically manage". Select your SSD, choose **Custom size**, set
   **Initial = 8192 MB, Maximum = 16384 MB**. Set, OK, **reboot**.

### A.3 Use the low-memory cargo profile
A ready-made profile ships at
[`../tools/lowmem-cargo-config.toml`](../tools/lowmem-cargo-config.toml). Copy it
into place (it is **opt-in** — not the repo default, so it never slows CI):
```powershell
Copy-Item tools\lowmem-cargo-config.toml "$env:USERPROFILE\.cargo\config.toml"
```
It contains settings that trade a little speed for **far lower peak RAM**:

```toml
# ~/.cargo/config.toml  — low-memory build profile for 8 GB machines
[build]
# Limit parallel codegen jobs so several linkers don't run at once.
jobs = 2

[profile.release]
# Thin LTO uses much less memory than fat "true" LTO; "off" uses the least.
lto = "thin"          # or: lto = false  (lowest memory, slightly larger binary)
codegen-units = 16    # more units = less peak RAM per unit (less optimization)
incremental = false
debug = false         # no debuginfo in release = smaller target\, less RAM
panic = "abort"       # smaller, faster-linking binaries

[profile.dev]
debug = 1             # line tables only; full debug=2 bloats target\ on small disks
```

> If a release link still OOMs, set `lto = false` and `codegen-units = 256`, and
> build one crate at a time (A.4). You can also set the env var
> `CARGO_BUILD_JOBS=1` for the heaviest crates.

### A.4 Build the engine crate-by-crate (gentlest on RAM)
Instead of one big `--release` build, build sequentially so only one heavy
linker runs at a time:

```powershell
# Debug first (cheap) to catch errors fast:
cargo build --workspace

# Then a memory-friendly release, package by package:
foreach ($p in @('b2030b-net','b2030b-policy-engine','b2030b-agent-runtime',`
                 'b2030b-redaction','b2030b-sync-client','b2030b-mv4-host')) {
  cargo build --release -p $p
}
# Finally the rest of the workspace (profile above keeps peak RAM down):
cargo build --workspace --release
```
(Use `cargo metadata --no-deps --format-version 1 | findstr name` to list the
actual package names if any differ.)

### A.5 UI, desktop app, and installers on 8 GB
The TypeScript/Tauri steps are light on RAM; the only heavy part is the Rust
backend link, already handled by the profile in A.3.

```powershell
yarn install
.\build.ps1 ui                       # UI bundles (low RAM)

cargo install tauri-cli --version "^2" --locked
cd ui\shell-desktop
# Build the app + MSI + NSIS using the low-memory release profile:
cargo tauri build --bundles msi,nsis
cd ..\..
```
If `cargo tauri build` OOMs at link time, build the frontend and backend
separately: `yarn --cwd ui\shell-desktop build` then
`cargo build --release -p b2030b-shell-desktop`, and run `cargo tauri build`
once the heavy crates are already compiled and cached.

### A.6 WASM cloud edition (very light)
```powershell
rustup target add wasm32-unknown-unknown   # if not already added
.\build.ps1 ui                              # builds cloud\wasm-edition too
```

### A.7 Android on 8 GB (optional, tight but doable)
Android Studio + Gradle is the most RAM-hungry optional step. Cap the Gradle JVM:
create `mobile\android\gradle.properties` (or add to it):
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.workers.max=2
org.gradle.daemon=false
```
Then:
```powershell
cd mobile\android
.\gradlew.bat bundleRelease        # AAB
cd ..\..
```
Close Android Studio (and the emulator!) while building from the command line.

### A.8 Keep `target\` from filling the disk
```powershell
cargo install cargo-cache --locked
cargo cache --autoclean          # trims the global registry cache
cargo clean -p <crate>           # drop a single crate's build output
# Nuclear option when low on space (forces a full rebuild next time):
cargo clean
```

➡️ **After §A you have exported:** engine release binaries, UI bundles, the
desktop `.exe`, the `.msi` and `-setup.exe` installers, the WASM cloud edition,
and (optionally) the Android `.aab`. That is the complete Windows-exportable set
for an 8 GB / 70 GB machine. For iOS, see §9 (needs macOS).

---

## 5. Build & export the Rust engine + crates

```powershell
# Debug build of the whole workspace (fast):
cargo build --workspace

# Release build (optimized; what you ship):
cargo build --workspace --release
# or use the wrapper:
.\build.ps1 engine
```
**Exported artifacts:** `target\release\*.exe`, `*.dll`, `*.lib`.

> **On 8 GB RAM:** do **not** run a fat-LTO release of the whole workspace at
> once — it can OOM the linker. Use the low-memory profile and crate-by-crate
> build in **§A.3–§A.4** instead.

Run the test suite + linters before packaging:
```powershell
cargo test --workspace
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
.\build.ps1 lint   # also runs the TS lints
```

---

## 6. Build & export the TypeScript UI

```powershell
yarn install
.\build.ps1 ui
# (equivalently: yarn workspaces foreach -A run build)
```
**Exported artifacts:** `ui\shell-desktop\dist\`, `ui\reader\dist\`,
`ui\pip\dist\`, `ui\devtools\dist\`, plus `cloud\wasm-edition\dist\`.

Run the UI unit tests:
```powershell
yarn test   # Vitest across UI/extension/cloud packages
```

---

## 7. Build & export the desktop app + Windows installers

The desktop shell is a **Tauri 2** app (`ui\shell-desktop\src-tauri`). Its
`bundle.targets` already include `msi` and `nsis`.

```powershell
# Install the Tauri CLI once:
cargo install tauri-cli --version "^2" --locked

# Dev run (hot-reload window) — optional sanity check:
cd ui\shell-desktop
cargo tauri dev

# Production build + installers:
cargo tauri build
```
**Exported artifacts** (under `ui\shell-desktop\src-tauri\target\release\`):
- `Browser 2030B.exe` — the standalone executable
- `bundle\msi\Browser 2030B_0.1.0_x64_en-US.msi` — **MSI installer** (WiX)
- `bundle\nsis\Browser 2030B_0.1.0_x64-setup.exe` — **NSIS installer**

To build **only** specific installers:
```powershell
cargo tauri build --bundles msi          # MSI only
cargo tauri build --bundles nsis         # NSIS only
```

### 7.1 Standalone MSI from the bundled WiX source (optional)
If you want to drive WiX directly from `packaging\windows-msi\b2030b.wxs`:
```powershell
# WiX v3 candle/light are on PATH after install:
candle.exe packaging\windows-msi\b2030b.wxs -o build\b2030b.wixobj
light.exe  build\b2030b.wixobj -o build\b2030b.msi
```

### 7.2 Code signing (before distribution)
For a trusted installer, sign the `.exe`/`.msi` with your Authenticode cert:
```powershell
signtool sign /fd SHA256 /a /tr http://timestamp.digicert.com /td SHA256 `
  "ui\shell-desktop\src-tauri\target\release\Browser 2030B.exe"
```
(`signtool.exe` ships with the Windows SDK installed in §2.2.)

---

## 8. Build & export the Android app (from Windows)

With the §2.10 toolchain installed:
```powershell
cd mobile\android
.\gradlew.bat assembleRelease        # APK
.\gradlew.bat bundleRelease          # AAB (for Play Store)
```
**Exported artifacts:**
- `mobile\android\build\outputs\apk\release\*.apk`
- `mobile\android\build\outputs\bundle\release\*.aab`

Sign the release with your keystore (`gradlew` reads signing config from your
`keystore.properties` — see [`../packaging/android-aab/README.md`](../packaging/android-aab/README.md)).

---

## 9. iOS (IPA) — cannot be done on Windows

Apple's toolchain (Xcode, `xcodebuild`, code signing) runs **only on macOS**.
From Windows you have three options:
1. Use a **Mac** (or macOS CI runner) and follow
   [`../packaging/ios-ipa/README.md`](../packaging/ios-ipa/README.md) +
   `ExportOptions.plist`.
2. Use a **cloud Mac** (e.g. a hosted macOS CI / build farm).
3. Build only the Swift core's logic/tests on the Mac; the iOS app is exported
   there, not on Windows.

The Swift sources live in `mobile\ios\` and build with Swift Package Manager on
macOS (`swift build`, `swift test`), then Xcode for the IPA.

---

## 10. One-shot: export everything buildable on Windows

**On a 16 GB+ machine** (full speed):
```powershell
# From the repo root, in a fresh shell after §2–§4:
.\build.ps1 all          # engine (release) + UI bundles
cargo install tauri-cli --version "^2" --locked
cd ui\shell-desktop; cargo tauri build; cd ..\..   # desktop app + MSI + NSIS
cd mobile\android; .\gradlew.bat bundleRelease; cd ..\..   # Android AAB (if §2.10 done)
```

**On the 8 GB / 70 GB machine**, do **§A** instead (low-memory profile in §A.3,
crate-by-crate engine build in §A.4, `--bundles msi,nsis` in §A.5, capped Gradle
in §A.7). Always `.\bootstrap.ps1 -NoEngine`.

---

## 11. Troubleshooting

| Symptom | Fix |
| --- | --- |
| `error: linker 'link.exe' not found` | Install/repair VS Build Tools **Desktop development with C++** (§2.2); open a *Developer PowerShell for VS*. |
| `libclang.dll not found` (bindgen) | Set `LIBCLANG_PATH` to `C:\Program Files\LLVM\bin` (§2.8); reopen shell. |
| Long-path errors during `cargo build` / Chromium | Enable long paths (§1.4) and keep the repo near the drive root, e.g. `C:\dev\2030b-browser`. |
| `cargo tauri` unknown command | `cargo install tauri-cli --version "^2" --locked`. |
| WebView2 missing at runtime | Install the WebView2 Runtime (§2.5). |
| MSI/NSIS bundle skipped | Ensure WiX (§2.6) and NSIS (§2.7) are on `PATH`; reopen shell. |
| `yarn` not found | `corepack enable` (§2.4); reopen shell. |
| Android `SDK location not found` | Set `ANDROID_HOME` (§2.10) and accept SDK licenses: `sdkmanager --licenses`. |
| Slow/huge engine fetch | Use `.\bootstrap.ps1 -NoEngine`; the engine integration crates build against vendoring shims. |
| **Out-of-memory / linker killed (8 GB RAM)** | Add a 16 GB pagefile (§A.2), use the low-memory cargo profile (§A.3: `lto="thin"` or `false`, high `codegen-units`, `jobs=2`), and build crate-by-crate (§A.4). Close browsers/Android Studio while linking. |
| **Disk full during build (70 GB)** | Never fetch Chromium (`-NoEngine`); `cargo cache --autoclean` and `cargo clean -p <crate>` (§A.8); uninstall Android Studio after exporting the AAB. |
| `STATUS_ACCESS_VIOLATION` / OOM in `cargo tauri build` | Build frontend + backend separately first, then `cargo tauri build` (§A.5). |

---

## 12. Quick reference — install commands (copy block)

```powershell
# Run as Administrator
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
winget install --id Git.Git -e
winget install --id Microsoft.VisualStudio.2022.BuildTools -e   # + "Desktop development with C++"
winget install --id Rustlang.Rustup -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Microsoft.EdgeWebView2Runtime -e
winget install --id WiXToolset.WiXToolset -e
winget install --id NSIS.NSIS -e
winget install --id LLVM.LLVM -e
# Optional (Android export):
winget install --id EclipseAdoptium.Temurin.17.JDK -e
winget install --id Google.AndroidStudio -e
# New shell:
rustup default 1.82; rustup component add rustfmt clippy rust-src
rustup target add x86_64-pc-windows-msvc aarch64-pc-windows-msvc wasm32-unknown-unknown
corepack enable; corepack prepare yarn@stable --activate
cargo install tauri-cli --version "^2" --locked
```
