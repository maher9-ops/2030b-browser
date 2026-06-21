//! Tauri host for the Browser 2030B desktop shell.
//!
//! The host is deliberately thin: it serves the static frontend and exposes a
//! tiny, default-deny command surface. All browser-chrome logic lives in the
//! TypeScript `Shell` model so it stays unit-testable and renderer-agnostic.

use serde::Serialize;

#[derive(Serialize)]
struct BuildInfo {
    name: &'static str,
    version: &'static str,
    /// Everything is opt-in; nothing phones home by default.
    default_deny: bool,
}

#[tauri::command]
fn build_info() -> BuildInfo {
    BuildInfo {
        name: "Browser 2030B",
        version: env!("CARGO_PKG_VERSION"),
        default_deny: true,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![build_info])
        .run(tauri::generate_context!())
        .expect("error while running Browser 2030B shell");
}
