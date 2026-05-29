//! 项目模型
//!
//! 管理 Mogan 项目的结构、文件列表和元数据。

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Mogan 项目
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    /// 项目名称
    pub name: String,
    /// 项目根目录
    pub root: PathBuf,
    /// 主文档路径
    pub main_document: Option<PathBuf>,
    /// 项目文件列表
    pub files: Vec<PathBuf>,
}

impl Project {
    /// 创建新项目
    pub fn new(name: String, root: PathBuf) -> Self {
        Self {
            name,
            root,
            main_document: None,
            files: Vec::new(),
        }
    }
}
