//! Git 版本控制命令

/// 获取 Git 日志
#[tauri::command]
pub async fn git_log(path: String) -> Result<String, String> {
    // TODO: 集成 gix crate
    let _ = path;
    Ok("[]".to_string())
}
