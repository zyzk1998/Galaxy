# Galaxy Ollama Orchestrator (本地生物信息学智能体)

这是一个基于 Web 的智能体界面，它连接本地部署的大语言模型 (Ollama) 和生物信息学分析平台 (Galaxy)。

用户可以通过自然语言（中文/英文）上传数据并指挥 Galaxy 执行分析任务。系统采用 **"胖客户端 (Fat Client)"** 架构，所有逻辑在浏览器中运行，无需额外部署后端中间件。

## 🛡️ 安全说明 (Security)

本项目**没有**硬编码任何服务器 IP 或 API Key。
- 所有的配置（服务器地址、Key、模型名称）都存储在你本地浏览器的 **localStorage** 中。
- 这意味着你可以放心地将代码分享给同事或上传到 GitHub，而不用担心泄露密钥。
- **首次运行时，你必须在设置面板中手动输入你的环境信息。**

## 🚀 快速开始教程

请按照以下步骤，从零开始掌握并运行本项目。

### 第一步：环境准备 (服务端)

在你的服务器 (假设 IP 为 `192.168.32.31`) 上，必须确保两个服务允许**跨域访问 (CORS)**，否则浏览器网页无法连接它们。

1.  **配置 Galaxy 允许跨域**:
    - 编辑 Galaxy 配置文件 (`galaxy.yml` 或 `galaxy.ini`)。
    - 设置 `access_control_allow_origin: '*'` (或者指定你的前端 IP)。
    - 重启 Galaxy 服务。

2.  **配置 Ollama 允许跨域**:
    - 在运行 Ollama 的终端环境中设置环境变量：
      ```bash
      export OLLAMA_ORIGINS="*"
      # 然后启动服务
      ollama serve
      ```

### 第二步：代码部署 (客户端)

本项目是纯前端项目，不需要编译（但在开发模式下推荐使用 Vite）。

1.  将所有代码文件保持当前的目录结构。
2.  确保包含以下核心文件：
    - `index.html` (入口)
    - `App.tsx` (主逻辑)
    - `constants.ts` (知识库)
    - `services/galaxyService.ts` (API 交互)

### 第三步：填充知识库 (关键步骤!)

LLM 不知道你服务器上安装的具体工具 ID，你需要教它。

1.  打开 `docs/KNOWLEDGE_BASE_GUIDE.md` 阅读详细指南。
2.  打开 `constants.ts` 文件。
3.  **这是你需要动脑动手的地方**：
    - 登录你的 Galaxy 网页。
    - 找到你想要 AI 调用的工具（比如 Grep, Head, FastQC）。
    - 获取它们的 **Tool ID** (如 `toolshed.g2.bx.psu.edu/...`)。
    - 检查它们的输入参数名。
    - 将这些信息填入 `constants.ts` 的 `mapping` 字段中。

> **提示**: 系统默认提供了一份 `text_filter` (Grep) 的模板，请务必将其中的 ID 替换为你服务器上的真实 ID。

### 第四步：运行项目

你有两种方式运行：

**方式 A: 使用 VSCode (最简单)**
1.  安装 "Live Server" 插件。
2.  在 VSCode 中打开 `index.html`。
3.  右键选择 "Open with Live Server"。

**方式 B: 使用 Python**
1.  在项目根目录下打开终端。
2.  运行: `python3 -m http.server 3000`
3.  浏览器访问: `http://localhost:3000`

### 第五步：使用流程

1.  **设置**: 首次打开网页，点击左下角的 "Settings"。
    - 输入 Ollama URL (例如 `http://192.168.32.31:11434`)。
    - 输入 Galaxy URL (例如 `http://192.168.32.31`)。
    - **输入你的 Galaxy API Key** (在 Galaxy User Preferences 中获取)。
    - 点击 Save。浏览器会记住这些信息。

2.  **上传**: 点击输入框左侧的“回形针”图标，上传一个文本文件（如 `.txt` 或 `.fasta`）。
    - 观察聊天窗口，系统会自动上传到 Galaxy 并获取 Dataset ID。

3.  **对话**: 输入指令，例如：
    - “查看这个文件的前 10 行” (触发 `head_tool`)
    - “过滤出包含 'gene_A' 的行” (触发 `text_filter`)

4.  **等待**: 界面会显示“正在向 Galaxy 发送请求...”，随后显示 Job ID。稍等片刻，结果会自动返回。

## 📂 文件结构说明

- `constants.ts`: **知识库**。定义了 AI 可用的工具以及如何调用 Galaxy API 的规则。
- `services/galaxyService.ts`: **执行手**。负责上传文件、发送 API 请求、轮询任务状态。
- `services/ollamaService.ts`: **大脑接口**。负责与本地 LLM 通信。
- `App.tsx`: **中控室**。协调上传、决策、执行的完整流程。
- `simple_demo.html`: **单文件演示版**。包含所有功能的独立 HTML 文件，适合快速演示或分享。

## ⚠️ 常见问题

- **报错 "Failed to fetch"**:
  - 99% 是因为 CORS 没配置好。请检查浏览器控制台 (F12 -> Console)，如果看到 "Access-Control-Allow-Origin" 错误，请重做“第一步”。
- **AI 说调用了工具，但 Galaxy 没反应**:
  - 检查 `constants.ts` 里的 `toolId` 是否正确。
  - 检查参数映射是否正确。Galaxy 的 API 参数对大小写敏感。