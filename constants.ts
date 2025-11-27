import { ToolDefinition } from './types';

// 安全配置：这里仅保留默认占位符。
// 实际的配置将存储在用户的浏览器 LocalStorage 中，不会提交到代码仓库。
export const DEFAULT_GALAXY_URL = 'http://localhost:8080'; 
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_MODEL = 'llama3';

// 【知识库核心】
// 请参考 docs/KNOWLEDGE_BASE_GUIDE.md 来填充此文件。
// 这里的 toolId 和参数映射必须与你服务器上安装的工具完全一致。
export const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    name: 'text_filter',
    description: '使用正则表达式或关键字过滤数据集的行 (类似 grep)。当用户想要"搜索"、"查找"或"过滤"特定内容时使用。必须提供 dataset_id。',
    parameters: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', description: '要处理的 Galaxy 数据集 ID (Dataset ID)。' },
        pattern: { type: 'string', description: '过滤的关键字或正则 (例如: "chr1", "gene_A")。' },
        invert: { type: 'boolean', description: '是否反转匹配 (即删除匹配行，对应 grep -v)。' }
      },
      required: ['dataset_id', 'pattern']
    },
    // RAG 规则：Galaxy API 映射
    mapping: {
      // TODO: 请替换为你服务器上真实的 Grep/Filter 工具 ID
      // 这里的 ID 只是示例，不同 Galaxy 版本可能不同
      toolId: 'Filter1', 
      params: {
        'dataset_id': { galaxyName: 'input', type: 'hda_ref' }, // 这里的 'input' 是 Galaxy grep 工具接受文件输入的参数名
        'pattern': 'cond', // 这里的 'cond' 是 Galaxy grep 工具接受过滤条件的参数名
        'invert': { galaxyName: 'invert', type: 'boolean_to_string' }
      },
      staticParams: {
        'header_lines': 0 
      }
    }
  },
  {
    name: 'head_tool',
    description: '查看数据集的前几行。用于"预览"数据、查看"表头"或检查数据格式。',
    parameters: {
      type: 'object',
      properties: {
        dataset_id: { type: 'string', description: 'Galaxy 数据集 ID。' },
        lines: { type: 'integer', description: '显示的行数 (默认 10)。' }
      },
      required: ['dataset_id']
    },
    mapping: {
      // TODO: 请替换为你服务器上真实的 Head 工具 ID
      toolId: 'Show beginning1',
      params: {
        'dataset_id': { galaxyName: 'input', type: 'hda_ref' },
        'lines': 'lines'
      }
    }
  },
  {
    name: 'get_histories',
    description: '获取当前用户的最近历史记录列表。',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
    // 无 mapping，因为这是内置 API 调用，不是 Tool Execution
  }
];

export const SYSTEM_PROMPT = `
你是一个智能生物信息学助手 Agent，运行在本地服务器上。
你的目标是帮助用户操作 Galaxy Server 上的数据。

【核心规则】
1. **工具调用 (Tool Use)**: 
   - 你有一个工具箱（见下文 Knowledge Base）。
   - 如果用户的请求可以通过工具解决，你**必须**输出且仅输出一个 JSON 格式的工具调用指令。
   - 不要输出任何 Markdown 代码块标记（如 \`\`\`json），只输出纯 JSON 字符串。
   
2. **上下文感知 (Context)**:
   - 当用户上传文件时，系统会告诉你该文件的 "Dataset ID"。
   - 在后续调用工具（如 text_filter, head_tool）时，你必须准确引用这个 dataset_id。

3. **回复格式**:
   - 如果需要操作：输出 JSON: {"tool": "tool_name", "parameters": { ... }}
   - 如果不需要操作（闲聊或解释）：使用中文直接回答。

【可用工具库 (Knowledge Base)】
${JSON.stringify(AVAILABLE_TOOLS.map(t => ({ name: t.name, description: t.description, parameters: t.parameters })), null, 2)}
`;