//! 文献管理命令

/// 加载文献数据库
#[tauri::command]
pub async fn load_bibliography(path: String) -> Result<Vec<String>, String> {
    let source = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    mogan_bib::parser::parse_bibtex(&source)
}
