//! Mogan — 科学写作桌面应用
//!
//! 基于 Tauri v2 + Typst + Svelte 构建。

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    mogan_lib::run()
}
