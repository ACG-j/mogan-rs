//! 数学片段模板

/// 数学片段
#[derive(Debug, Clone)]
pub struct Snippet {
    /// 显示标签
    pub label: &'static str,
    /// Typst 代码片段
    pub code: &'static str,
}

/// 获取所有数学片段
pub fn all_snippets() -> Vec<Snippet> {
    // TODO: 预置常用数学片段模板
    Vec::new()
}
