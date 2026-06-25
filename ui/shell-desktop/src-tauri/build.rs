//! Build script for the Browser 2030B Tauri host.
//!
//! Besides the standard `tauri_build::build()`, this regenerates a *valid,
//! single-image* `icons/icon.ico` from `icons/icon.png` on every build.
//!
//! Why: Windows' `rc.exe` (invoked by Tauri's bundler) rejects `.ico` files
//! that are multi-image or have a non-zero ICONDIRENTRY reserved field — the
//! classic "bad ICONDIRENTRY" / blank-icon failure. Favicons and
//! `System.Drawing`-produced icons routinely trip this. Generating the icon
//! here with the `ico` crate guarantees a single 256x256 RGBA entry with the
//! reserved field set to 0, so the build is self-healing regardless of what
//! the committed `icon.ico` happens to be.

use std::path::Path;

fn main() {
    regenerate_ico();
    tauri_build::build();
}

fn regenerate_ico() {
    let png_path = Path::new("icons/icon.png");
    let ico_path = Path::new("icons/icon.ico");

    // Only rerun when the source PNG changes.
    println!("cargo:rerun-if-changed=icons/icon.png");

    let Ok(file) = std::fs::File::open(png_path) else {
        // No source PNG (e.g. a partial checkout) — leave any committed icon
        // in place rather than failing the whole build.
        println!("cargo:warning=icons/icon.png not found; using existing icon.ico");
        return;
    };

    let decoder = png::Decoder::new(file);
    let mut reader = match decoder.read_info() {
        Ok(r) => r,
        Err(e) => {
            println!("cargo:warning=could not read icon.png ({e}); keeping existing icon.ico");
            return;
        }
    };
    let mut buf = vec![0; reader.output_buffer_size()];
    let info = match reader.next_frame(&mut buf) {
        Ok(i) => i,
        Err(e) => {
            println!("cargo:warning=could not decode icon.png ({e}); keeping existing icon.ico");
            return;
        }
    };

    // Normalise to RGBA8 so the ICO has a single, well-formed 32-bpp entry.
    let rgba = to_rgba8(&buf[..info.buffer_size()], info.width, info.height, info.color_type);
    let src = ico::IconImage::from_rgba_data(info.width, info.height, rgba);

    let mut icon_dir = ico::IconDir::new(ico::ResourceType::Icon);
    match ico::IconDirEntry::encode(&src) {
        Ok(entry) => icon_dir.add_entry(entry),
        Err(e) => {
            println!("cargo:warning=could not encode icon entry ({e}); keeping existing icon.ico");
            return;
        }
    }

    if let Ok(out) = std::fs::File::create(ico_path) {
        if let Err(e) = icon_dir.write(out) {
            println!("cargo:warning=could not write icon.ico ({e})");
        }
    }
}

/// Expand whatever PNG color type we got into tightly-packed RGBA8.
fn to_rgba8(data: &[u8], width: u32, height: u32, color: png::ColorType) -> Vec<u8> {
    let px = (width * height) as usize;
    match color {
        png::ColorType::Rgba => data.to_vec(),
        png::ColorType::Rgb => {
            let mut out = Vec::with_capacity(px * 4);
            for chunk in data.chunks_exact(3) {
                out.extend_from_slice(&[chunk[0], chunk[1], chunk[2], 255]);
            }
            out
        }
        png::ColorType::GrayscaleAlpha => {
            let mut out = Vec::with_capacity(px * 4);
            for chunk in data.chunks_exact(2) {
                out.extend_from_slice(&[chunk[0], chunk[0], chunk[0], chunk[1]]);
            }
            out
        }
        png::ColorType::Grayscale => {
            let mut out = Vec::with_capacity(px * 4);
            for &g in data {
                out.extend_from_slice(&[g, g, g, 255]);
            }
            out
        }
        // Indexed is uncommon for app icons; fall back to opaque white so the
        // build never panics on an unexpected source format.
        png::ColorType::Indexed => vec![255; px * 4],
    }
}
