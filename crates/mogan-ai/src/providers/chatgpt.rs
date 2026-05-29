//! ChatGPT API 集成

/// ChatGPT 提供商
pub struct ChatGPT;

impl ChatGPT {
    /// 发送提示并获取回复
    pub async fn chat(_prompt: &str) -> Result<String, String> {
        // TODO: reqwest + SSE 流式调用
        Ok(String::new())
    }
}
