// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::lib_loading::AppState;
use serde::{Deserialize, Serialize};
use tauri::ipc::Response;
use tauri::{Manager, WindowEvent};
use std::path::{Path, PathBuf};

mod lib_loading;


#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
struct PersistedWindowSize {
    width: f64,
    height: f64,
}

fn window_state_path(app: &tauri::AppHandle) -> Option<std::path::PathBuf> {
    app.path()
        .app_data_dir()
        .ok()
        .map(|dir| dir.join("window_state.json"))
}

fn load_window_size(app: &tauri::AppHandle) -> Option<PersistedWindowSize> {
    let path = window_state_path(app)?;
    let raw = std::fs::read_to_string(path).ok()?;
    let parsed: PersistedWindowSize = serde_json::from_str(&raw).ok()?;
    if !parsed.width.is_finite() || !parsed.height.is_finite() {
        return None;
    }
    if parsed.width < 480.0 || parsed.height < 320.0 || parsed.width > 7680.0 || parsed.height > 4320.0 {
        return None;
    }
    Some(parsed)
}

fn save_window_size(app: &tauri::AppHandle, size: PersistedWindowSize) {
    let Some(path) = window_state_path(app) else { return };
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Ok(json) = serde_json::to_string(&size) {
        let _ = std::fs::write(path, json);
    }
}

const TEST_GAUGE_DLL_ENV: &str = "IWE_TEST_WASM_DLL_PATH";

fn maybe_load_dotenv() {
    let _ = dotenvy::dotenv();
    let _ = dotenvy::from_path("../.env");
}

fn resolve_test_gauge_dll_path() -> anyhow::Result<PathBuf> {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    let repo_root = manifest_dir.parent().map(Path::to_path_buf);

    let canonicalize_if_possible = |p: PathBuf| {
        std::fs::canonicalize(&p)
            .unwrap_or(p)
    };

    if let Ok(raw) = std::env::var(TEST_GAUGE_DLL_ENV) {
        let raw = raw.trim();
        if !raw.is_empty() {
            let direct = PathBuf::from(raw);
            let from_manifest = manifest_dir.join(raw);
            let from_repo = repo_root.as_ref().map(|r| r.join(raw));

            let mut candidates = vec![direct, from_manifest];
            if let Some(p) = from_repo {
                candidates.push(p);
            }

            for c in candidates {
                if c.exists() {
                    return Ok(canonicalize_if_possible(c));
                }
            }

            anyhow::bail!(
                "{TEST_GAUGE_DLL_ENV} was set to '{raw}', but no file was found at: '{raw}', '{}' or '{}'",
                manifest_dir.join(raw).display(),
                repo_root
                    .as_ref()
                    .map(|r| r.join(raw).display().to_string())
                    .unwrap_or_else(|| "<repo root unavailable>".to_string())
            );
        }
    }


    let default = manifest_dir.join("bin/wasm_test.dll");
    if default.exists() {
        return Ok(canonicalize_if_possible(default));
    }

    anyhow::bail!(
        "Could not find wasm_test.dll at '{}'. Set {TEST_GAUGE_DLL_ENV} to an absolute path (or repo-relative path) and ensure nvg_shim.dll is next to it.",
        manifest_dir.join("bin/wasm_test.dll").display()
    )
}


#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn render_attitude(state: tauri::State<AppState>, win_w: i32, win_h: i32, dpr: f32) -> Response {
    let mut g = state.gauge.lock().unwrap();
    unsafe {
        let (bytes, fbw, fbh) = g.render(win_w, win_h, dpr);

        // Pack header (fbw, fbh) + RGBA bytes.
        // Frontend reads 2 little-endian u32s, then pixel bytes.
        let mut out = Vec::with_capacity(8 + bytes.len());
        out.extend_from_slice(&(fbw as u32).to_le_bytes());
        out.extend_from_slice(&(fbh as u32).to_le_bytes());
        out.extend_from_slice(bytes);
        Response::new(out)
    }
}
fn main() {
    maybe_load_dotenv();

    let gauge_path = resolve_test_gauge_dll_path().expect("failed to resolve test gauge DLL path");
    println!("[native] loading test gauge from: {}", gauge_path.display());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(win) = app.get_webview_window("main") {
                if let Some(size) = load_window_size(app.handle()) {
                    let _ = win.set_size(tauri::Size::Logical(tauri::LogicalSize {
                        width: size.width,
                        height: size.height,
                    }));
                }

                let _ = win.center();

                let _ = win.show();
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }

            if let WindowEvent::Resized(physical) = event {
                let scale = window.scale_factor().unwrap_or(1.0);
                let logical: tauri::LogicalSize<f64> = physical.to_logical(scale);
                save_window_size(
                    window.app_handle(),
                    PersistedWindowSize {
                        width: logical.width,
                        height: logical.height,
                    },
                );
            }
        })
        .manage(AppState {
            gauge: std::sync::Mutex::new(unsafe {
                let gauge = lib_loading::LoadedGauge::load(gauge_path.clone())
                    .expect("failed to load gauge");
                lib_loading::GaugeRuntime::new(gauge, 800, 600, 1.0)
                    .expect("failed to initialize gauge runtime")
            }),
        })
        .invoke_handler(tauri::generate_handler![greet, render_attitude])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

