# Browser 2030B - bootstrap (Windows PowerShell equivalent of ./bootstrap)
# Codename: b2030b
[CmdletBinding()]
param(
    [switch]$NoEngine,
    [switch]$Check
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Log($m)  { Write-Host "[bootstrap] $m" -ForegroundColor Cyan }
function Warn($m) { Write-Host "[bootstrap] $m" -ForegroundColor Yellow }
function Have($c) { $null -ne (Get-Command $c -ErrorAction SilentlyContinue) }

Log "Detected platform: Windows"

# Rust
if (Have rustup) {
    Log "rustup present; syncing pinned toolchain"
} elseif (-not $Check) {
    Log "Installing rustup (channel 1.82)"
    Invoke-WebRequest -Uri "https://win.rustup.rs" -OutFile "$env:TEMP\rustup-init.exe"
    & "$env:TEMP\rustup-init.exe" -y --default-toolchain 1.82 --profile default
} else { Warn "rustup missing (check-only)" }

# Node + Corepack
if (Have node) { Log "node present: $(node --version)" } else { Warn "node >= 20 required" }
if (Have corepack) { corepack enable | Out-Null; Log "corepack enabled" }

# Bazel
if ((Have bazelisk) -or (Have bazel)) { Log "bazel present" } else { Warn "bazel optional for dev" }

# Engine fetch
if ($NoEngine -or $Check) {
    Log "Skipping engine fetch"
} else {
    New-Item -ItemType Directory -Force -Path "$Root\third_party" | Out-Null
    Warn "Run tools\repro-build\fetch-chromium.ps1 to fetch Chromium (~100 GB)."
}

if ($Check) { Log "Environment check complete." } else { Log "Bootstrap complete. Next: .\build.ps1 all" }
