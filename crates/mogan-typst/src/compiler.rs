//! typst-ide Server 封装
//!
//! 提供编译、SVG/PDF 导出、自动补全、跳转定义等 IDE 功能。

/// Typst 增量编译器
pub struct Compiler {
    // TODO: 封装 typst_ide::TypstServer
}

impl Compiler {
    /// 创建新的编译器实例
    pub fn new() -> Self {
        Self {}
    }

    /// 更新源码并重新编译
    pub fn update(&mut self, _source: &str) -> Result<(), String> {
        Ok(())
    }

    /// 导出指定页面为 SVG
    pub fn export_svg(&self, _page: usize) -> Result<String, String> {
        Ok(String::new())
    }

    /// 导出为 PDF
    pub fn export_pdf(&self) -> Result<Vec<u8>, String> {
        Ok(Vec::new())
    }

    /// 自动补全
    pub fn autocomplete(&self, _pos: usize) -> Vec<String> {
        Vec::new()
    }

    /// 跳转到定义
    pub fn goto_definition(&self, _pos: usize) -> Option<usize> {
        None
    }
}

impl Default for Compiler {
    fn default() -> Self {
        Self::new()
    }
}
