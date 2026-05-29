//! Typst 数学符号表

/// Typst 数学符号
#[derive(Debug, Clone)]
pub struct Symbol {
    /// 符号名称
    pub name: &'static str,
    /// Typst 命令
    pub command: &'static str,
    /// 符号描述
    pub description: &'static str,
}

/// 获取所有数学符号
pub fn all_symbols() -> Vec<Symbol> {
    // TODO: 从 Typst 提取完整符号表
    Vec::new()
}
