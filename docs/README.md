# Mogan STEM 开发文档

## 项目概述

Mogan STEM 是一个现代化的科学写作桌面应用，基于 Rust + Tauri v2 + Typst + Svelte 构建。

## 技术栈

- **桌面壳**: Tauri v2
- **前端**: Svelte 5 + Vite + CodeMirror 6
- **排版引擎**: Typst 0.13
- **异步运行时**: Tokio

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建
npm run build
```

## 项目结构

```
mogan-rs/
├── src-tauri/          # Tauri v2 Rust 后端
├── crates/             # Rust 库
│   ├── mogan-core/     # 核心类型
│   ├── mogan-typst/    # Typst 集成
│   ├── mogan-convert/  # 格式转换
│   ├── mogan-bib/      # 文献管理
│   ├── mogan-math/     # 数学符号
│   └── mogan-ai/       # AI 集成
├── src/                # Svelte 前端
├── tests/              # 集成测试
├── benches/            # 性能基准
└── docs/               # 文档
```

## 构建

```bash
cargo build --workspace
```
