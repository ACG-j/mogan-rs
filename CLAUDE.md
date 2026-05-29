# Mogan rs 开发规范

## 分支命名

格式：`username/<type>/<description>`

- `username`: 开发者 git 用户名
- `type`: 变更类型，取 `feat` / `fix` / `chore` / `refactor` / `docs`
- `description`: 简短英文描述，用连字符分隔

例如：
- `ation_ciger/feat/typst-compiler`
- `ation_ciger/fix/ci-install-action`
- `ation_ciger/chore/rename-app`

## 提交规范

- 一个 PR 聚焦一个变更主题
- 提交信息格式：`<type>: <简述>`
- 推送：直接使用 `git push`，不使用 `gh` 命令

## 代码检查

推送前需通过：

```
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo crap
```

完整列表见 `.github/workflows/check.yml`。

CI 门禁：

| 检查 | 工具 | 失败条件 |
|------|------|----------|
| 格式 | `cargo fmt` | 不一致 |
| Lint | `cargo clippy` | 任何 warning |
| 复杂度 | `cargo crap` | CRAP > 30 |
| 安全 | `cargo audit` | 已知漏洞 |
| 覆盖率 | `cargo llvm-cov` + `cargo crap --lcov` | CRAP > 30 |
| 文档 | `cargo doc` | 任何 warning |

## Rust 代码规范

- Edition 2024
- `pub` 类型须实现 `Debug`
- 有 `new()` 须同步实现 `Default`
- 使用 `thiserror` 定义错误，不用裸 `String`
- 异步用 `tokio`

## 构建

```bash
cargo build --workspace
cargo test --workspace
```
