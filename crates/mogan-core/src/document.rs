//! 文档树模型
//!
//! 表示一个 Mogan 文档的完整树形结构。

use serde::{Deserialize, Serialize};

/// 文档树根节点
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentTree {
    /// 根节点内容
    pub root: String,
}

impl DocumentTree {
    /// 创建空的文档树
    pub fn new() -> Self {
        Self {
            root: String::new(),
        }
    }
}

impl Default for DocumentTree {
    fn default() -> Self {
        Self::new()
    }
}
