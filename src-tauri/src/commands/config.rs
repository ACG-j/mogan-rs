//! 配置命令

/// 获取当前配置
#[tauri::command]
pub async fn get_config() -> Result<String, String> {
    // TODO: 从 TOML 文件读取配置
    Ok("{}".to_string())
}
