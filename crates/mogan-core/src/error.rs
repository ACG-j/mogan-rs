//! 错误类型定义

use thiserror::Error;

/// Mogan 核心错误类型
#[derive(Debug, Error)]
pub enum CoreError {
    /// IO 错误
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    /// 序列化/反序列化错误
    #[error("Serialization error: {0}")]
    Serde(#[from] serde_json::Error),

    /// 文件未找到
    #[error("File not found: {0}")]
    FileNotFound(String),

    /// 项目无效
    #[error("Invalid project: {0}")]
    InvalidProject(String),
}
