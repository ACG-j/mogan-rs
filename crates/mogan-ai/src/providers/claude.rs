//! Claude API 集成

/// Claude 提供商
pub struct Claude;

impl Claude {
    /// 发送提示并获取回复
    pub async fn chat(_prompt: &str) -> Result<String, String> {
        // TODO: reqwest + SSE 流式调用
        Ok(String::new())
    }
}
