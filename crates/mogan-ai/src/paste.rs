//! 格式化粘贴（魔法粘贴）

/// 将 LLM 返回的内容转换为 Typst 格式
pub fn format_paste(_raw: &str) -> Result<String, String> {
    // TODO: 识别数学公式、代码块、表格并转为 Typst
    Ok(String::new())
}
