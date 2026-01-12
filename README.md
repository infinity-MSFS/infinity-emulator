# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Native test gauge DLL

This repo includes a test native gauge DLL pair for local development:

- `src-tauri/bin/wasm_test.dll`
- `src-tauri/bin/nvg_shim.dll` (dependency; must remain next to the main DLL)

By default, the app will try to load the DLL from the repo-local path.

If you need to override the location, create a `.env` file (see `.env.example`) and set:

- `IWE_TEST_WASM_DLL_PATH=...`
