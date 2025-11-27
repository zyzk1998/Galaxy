# 项目上下文记忆提示词 (Project Context Prompt)

如果你需要在新的对话中让我（AI）快速理解这个项目的所有细节，请直接复制以下内容发送给我：

---

**项目背景：本地 Galaxy-Ollama 生物信息学智能体 (胖客户端架构)**

我正在构建一个基于浏览器的“胖客户端”智能体，用于生物信息学分析。
- **前端架构**：React + Tailwind (纯静态页面，无中间件 Node 服务器)。
- **后端 1 (大脑)**：本地 Ollama (模型: gpt-oss:120b)，地址：`http://192.168.32.31:11434`。
- **后端 2 (执行者)**：本地 Galaxy 服务器，地址：`http://192.168.32.31` (需要 API Key)。

**核心工作流 (Core Workflow):**

1.  **前端驱动的 RAG (Frontend-Driven RAG)**：
    - 前端维护一个 `constants.ts` 文件作为**知识库**。
    - **工具定义 (Tool Definitions)**：包含供 LLM 理解的 JSON Schema (例如 `text_filter` 的用途)。
    - **API 映射 (API Mappings)**：包含将抽象指令转换为具体 Galaxy API 请求的规则 (例如：`pattern` 参数 -> 对应 Galaxy API 的 `cond` 参数，`dataset_id` -> `hda_ref`)。

2.  **交互闭环 (Interaction Loop)**：
    - **上传**：用户上传文件 -> 前端直接传给 Galaxy -> 获取 `Dataset ID` -> 注入到 LLM 的上下文提示词中。
    - **决策**：用户提问 -> LLM 返回 JSON 决策 (`{"tool": "text_filter", ...}`)。
    - **映射与执行**：前端拦截 JSON -> 查阅 `constants.ts` 映射表 -> 构建真实的 POST 请求发给 Galaxy。
    - **轮询 (Polling)**：前端对 Galaxy Job API 进行轮询，直到状态变为 `ok` -> 向用户展示结果。

**当前状态 (Current Status):**
- 代码结构已定 (`App.tsx` 控制流程, `galaxyService.ts` 处理逻辑, `constants.ts` 存储知识)。
- 关键依赖：标准 Galaxy API。
- **核心约束**：用户必须手动更新 `constants.ts`，填入其服务器上真实的 Galaxy Tool ID 和参数名。

**当前任务**: [在此处填写你具体想要修改或新增的功能]
