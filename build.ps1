# Browser 2030B - build (Windows PowerShell equivalent of ./build)
# Codename: b2030b
[CmdletBinding()]
param(
    [Parameter(Position=0)][string]$Command = "all",
    [string]$Channel = "stable"
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $Root

function Log($m)  { Write-Host "[build] $m" -ForegroundColor Green }
function Warn($m) { Write-Host "[build] $m" -ForegroundColor Yellow }
function Have($c) { $null -ne (Get-Command $c -ErrorAction SilentlyContinue) }

function Build-Engine {
    if (Have cargo) { Log "Building Rust workspace"; cargo build --workspace --release }
    else { Warn "cargo not found - run .\bootstrap.ps1" }
}
function Build-UI {
    if (Have yarn) { Log "Building UI"; yarn install; yarn build }
    elseif (Have npm) { Log "Building UI (npm)"; npm install; npm run build --workspaces --if-present }
    else { Warn "yarn/npm not found" }
}
function Run-Tests { if (Have cargo) { cargo test --workspace }; if (Have yarn) { yarn test } }
function Run-Lint {
    if (Have cargo) { cargo clippy --workspace --all-targets -- -D warnings; cargo fmt --all -- --check }
    if (Have yarn) { yarn lint; yarn typecheck }
}
function Do-Release {
    if ($Channel -notin @("stable","beta","dev","canary","esr")) { throw "invalid channel $Channel" }
    Log "Release pipeline for channel: $Channel"
    Build-Engine; Build-UI
    New-Item -ItemType Directory -Force -Path "$Root\dist" | Out-Null
    Log "Artifacts staged in dist\ for channel $Channel"
}

switch ($Command) {
    "all"     { Build-Engine; Build-UI; Log "Build 'all' complete." }
    "engine"  { Build-Engine }
    "ui"      { Build-UI }
    "test"    { Run-Tests }
    "lint"    { Run-Lint }
    "release" { Do-Release }
    "clean"   { Remove-Item -Recurse -Force "$Root\target","$Root\dist","$Root\node_modules" -ErrorAction SilentlyContinue }
    default   { Warn "Unknown command '$Command'" }
}
