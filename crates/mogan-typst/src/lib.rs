//! Mogan Typst — Typst 排版引擎集成层
//!
//! 封装 typst-ide 的增量编译管线，提供编译、SVG 导出、自动补全等功能。

pub mod compiler;
pub mod svg;
pub mod world;

pub use compiler::Compiler;
pub use world::MoganWorld;
