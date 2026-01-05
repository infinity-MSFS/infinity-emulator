// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::lib_loading::AppState;
use tauri::ipc::Response;

mod lib_loading;


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
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            gauge: std::sync::Mutex::new(unsafe {
                let gauge = lib_loading::LoadedGauge::load("C:\\Users\\Cameron\\Documents\\github\\wasm_test\\cmake-build-debug\\wasm_test.dll".into())
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

