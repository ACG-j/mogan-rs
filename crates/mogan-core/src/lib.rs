//! Mogan Core — 核心类型与文档模型
//!
//! 提供 Mogan 项目的基础数据结构：文档树、项目模型、错误类型。

pub mod document;
pub mod error;
pub mod project;

pub use document::DocumentTree;
pub use error::CoreError;
pub use project::Project;
