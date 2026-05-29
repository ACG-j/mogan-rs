//! Mogan 核心库 — Tauri 应用入口

pub mod commands;
pub mod state;

use state::AppState;

/// 启动 Mogan 应用
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::compile::compile_document,
            commands::file::open_file,
            commands::file::save_file,
            commands::convert::convert_latex_to_typst,
            commands::bib::load_bibliography,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Mogan application");
}
