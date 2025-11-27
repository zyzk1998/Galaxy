# 项目上下文记忆提示词 (Project Context Prompt)

如果你需要在新的对话中让我（AI）快速理解这个项目的所有细节，请直接复制以下内容发送给我：

---

**项目背景：本地 Galaxy-Ollama 生物信息学智能体 (胖客户端架构)**

我正在构建一个基于浏览器的“胖客户端”智能体，用于生物信息学分析。
- **前端架构**：HTML5 + Tailwind + Vanilla JS (单文件 `demo.html` 演示版)。
- **后端架构**：
  - **大脑**：本地 Ollama (双模型路由)。
  - **执行者**：本地 Galaxy 服务器 (需要 API Key)。

**核心工作流 (Core Workflow):**

1.  **前端驱动的 RAG (Frontend-Driven RAG)**：
    - 前端内置 `INTERNAL_KNOWLEDGE_BASE` 常量作为知识库。
    - **UI 呈现**：左侧侧边栏展示 Galaxy 工具列表。
    - **API 映射**：包含将抽象指令转换为具体 Galaxy API 请求的规则 (映射 `toolId` 和 `params`)。

2.  **智能模型路由 (Auto-Routing)**：
    - 系统根据是否有文件上下文 (`lastUploadedDatasetId`) 自动选择模型：
    - **Chat Model** (`gpt-oss:120b`): 用于纯文本对话。
    - **Data Model** (`qwen3-embedding:4b`): 用于多模态/文件分析/OCR。

3.  **交互闭环 (Interaction Loop)**：
    - **上传**：用户上传文件 -> 前端传给 Galaxy -> 注入上下文 -> **自动切换至 Data Model**。
    - **决策**：用户提问 -> LLM 返回 JSON 决策。
    - **视觉反馈**：Agent 决定调用工具时，左侧侧边栏对应工具会**闪烁紫色高亮**。
    - **执行**：查表映射 -> 发送 Galaxy 请求 -> 轮询状态 -> 显示结果。

**当前状态 (Current Status):**
- UI 已改为**浅色/办公风格**。
- 管理员配置（API Key, URL, 模型名）已折叠隐藏，且持久化在 LocalStorage。
- `demo.html` 是当前的演示核心。

**核心约束**：
- 用户必须手动在 Admin 面板配置其服务器上真实的 Tool ID。
- 必须确保 Ollama 和 Galaxy 配置了 CORS 跨域允许。

**当前任务**: [在此处填写你具体想要修改或新增的功能]