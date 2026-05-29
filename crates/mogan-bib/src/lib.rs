//! Mogan Bib — 文献管理
//!
//! 基于 hayagriva 的文献数据库，支持 BibTeX/BibLaTeX 解析与 CSL 格式化。

pub mod manager;
pub mod parser;

pub use manager::Bibliography;
