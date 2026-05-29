//! Typst 编译命令

use crate::state::AppState;
use tauri::State;

/// 编译 Typst 文档并返回 SVG
#[tauri::command]
pub async fn compile_document(
    state: State<'_, AppState>,
    source: String,
) -> Result<String, String> {
    let mut compiler = state.lock_compiler()?;
    compiler.update(&source)?;
    compiler.export_svg(0)
}
