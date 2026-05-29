//! 应用全局状态

use mogan_typst::compiler::Compiler;
use std::sync::Mutex;

/// Tauri 管理的全局应用状态
pub struct AppState {
    /// Typst 编译器实例
    compiler: Mutex<Compiler>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            compiler: Mutex::new(Compiler::new()),
        }
    }

    /// 获取编译器锁，自动处理 PoisonError 转换
    pub fn lock_compiler(&self) -> Result<std::sync::MutexGuard<'_, Compiler>, String> {
        self.compiler.lock().map_err(|e| e.to_string())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
