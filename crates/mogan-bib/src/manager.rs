//! 文献数据库管理器

/// 文献数据库
pub struct Bibliography {
    /// 文献条目
    pub entries: Vec<String>,
}

impl Bibliography {
    /// 创建空数据库
    pub fn new() -> Self {
        Self {
            entries: Vec::new(),
        }
    }

    /// 从 BibTeX 文件加载
    pub fn load_bibtex(&mut self, _path: &str) -> Result<(), String> {
        Ok(())
    }
}

impl Default for Bibliography {
    fn default() -> Self {
        Self::new()
    }
}
