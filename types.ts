export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'tool_call' | 'tool_result' | 'error' | 'info';
  metadata?: any;
}

export interface AppConfig {
  ollamaUrl: string;
  ollamaModel: string;
  galaxyUrl: string;
  galaxyApiKey: string;
}

// Galaxy API Types
export interface GalaxyHistory {
  id: string;
  name: string;
}

export interface GalaxyTool {
  id: string;
  name: string;
  description: string;
  version: string;
}

export interface GalaxyJob {
  id: string;
  state: 'new' | 'queued' | 'running' | 'ok' | 'error' | 'paused' | 'upload';
  tool_id: string;
  outputs: Array<{
    id: string;
    src: string; // usually 'hda'
    uuid: string;
    name?: string;
  }>;
}

// Ollama API Types
export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
}

// Tool Definition with RAG Mapping Rules
export interface ToolDefinition {
  name: string; // LLM 使用的工具名 (如 text_filter)
  description: string; // LLM 使用的描述
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  // RAG/知识库部分：定义如何将抽象工具映射为真实的 Galaxy API 请求
  mapping?: {
    toolId: string; // Galaxy 真实的 Tool ID (如 Filter1)
    // 参数映射关系: key是LLM参数名, value是Galaxy API参数名
    // 如果 value 是对象，则支持更复杂的转换 (src, default value等)
    params: Record<string, string | { galaxyName: string, type?: 'boolean_to_string' | 'hda_ref' }>;
    staticParams?: Record<string, any>; // 固定的隐藏参数
  }
}