//! 格式转换命令

/// 将 LaTeX 转换为 Typst
#[tauri::command]
pub async fn convert_latex_to_typst(latex_source: String) -> Result<String, String> {
    mogan_convert::latex::parser::parse(&latex_source).map_err(|e| e.to_string())?;
    mogan_convert::latex::translator::translate(&latex_source)
}
