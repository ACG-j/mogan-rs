//! Typst World 实现
//!
//! 实现 typst::World trait，管理文件系统和字体。

/// Typst 编译环境
pub struct MoganWorld {
    // TODO: 实现 typst::World trait
    // - 管理源码文件
    // - 管理字体
    // - 跟踪文件变更（脏标记）
}

impl MoganWorld {
    /// 创建新的 World 实例
    pub fn new() -> Self {
        Self {}
    }
}

impl Default for MoganWorld {
    fn default() -> Self {
        Self::new()
    }
}
