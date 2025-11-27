import { GalaxyHistory, GalaxyJob, ToolDefinition } from '../types';
import { AVAILABLE_TOOLS } from '../constants';

export class GalaxyService {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.apiKey
    };
  }

  async getHistories(): Promise<GalaxyHistory[]> {
    const res = await fetch(`${this.baseUrl}/api/histories?order=update_time`, { headers: this.headers });
    if (!res.ok) throw new Error('Failed to fetch histories');
    return res.json();
  }

  async createHistory(name: string): Promise<GalaxyHistory> {
    const res = await fetch(`${this.baseUrl}/api/histories`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ name })
    });
    return res.json();
  }

  async uploadData(historyId: string, content: string, name: string, fileType: string = 'auto') {
    const payload = {
      tool_id: 'upload1',
      history_id: historyId,
      inputs: {
        'files_0|type': 'upload_dataset',
        'files_0|NAME': name,
        'files_0|url_paste': content,
        'dbkey': '?',
        'file_type': fileType,
      }
    };

    const res = await fetch(`${this.baseUrl}/api/tools`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(payload)
    });
    
    if(!res.ok) {
        const err = await res.text();
        throw new Error(`Upload failed: ${err}`);
    }
    return res.json(); 
  }

  /**
   * 核心逻辑：查询知识库并执行工具
   * 1. 接收 LLM 的抽象指令 (toolName, params)
   * 2. 在 AVAILABLE_TOOLS 中查找对应的 RAG Mapping 规则
   * 3. 转换为 Galaxy 真实的 API Payload
   */
  async runTool(toolName: string, llmParams: any, historyId: string) {
    // 1. 查询知识库
    const toolDef = AVAILABLE_TOOLS.find(t => t.name === toolName);
    
    if (!toolDef) {
        throw new Error(`工具 '${toolName}' 未在知识库中定义`);
    }

    if (!toolDef.mapping) {
        throw new Error(`工具 '${toolName}' 缺少 API 映射规则`);
    }

    const { toolId, params: paramMapping, staticParams } = toolDef.mapping;
    const inputs: any = { ...staticParams };

    // 2. 动态参数映射
    for (const [llmKey, llmValue] of Object.entries(llmParams)) {
        const mapRule = paramMapping[llmKey];
        
        if (!mapRule) {
            console.warn(`参数 '${llmKey}' 未在映射规则中定义，将被忽略。`);
            continue;
        }

        if (typeof mapRule === 'string') {
            // 直接重命名
            inputs[mapRule] = llmValue;
        } else {
            // 复杂类型转换
            const targetKey = mapRule.galaxyName;
            
            if (mapRule.type === 'hda_ref') {
                // 转换为 Galaxy 数据集引用对象
                inputs[targetKey] = { src: 'hda', id: llmValue };
            } else if (mapRule.type === 'boolean_to_string') {
                // Boolean 转 String
                inputs[targetKey] = llmValue ? "true" : "false";
            } else {
                inputs[targetKey] = llmValue;
            }
        }
    }

    const payload = {
        tool_id: toolId,
        history_id: historyId,
        inputs: inputs
    };

    console.log(`[GalaxyService] Applying RAG Rules for ${toolName}:`, payload);

    // 3. 发送请求
    const res = await fetch(`${this.baseUrl}/api/tools`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Tool execution failed: ${err}`);
    }

    return res.json();
  }

  async getJob(jobId: string): Promise<GalaxyJob> {
    const res = await fetch(`${this.baseUrl}/api/jobs/${jobId}`, { headers: this.headers });
    if (!res.ok) throw new Error('Failed to fetch job status');
    return res.json();
  }

  // 轮询等待
  async waitForJob(jobId: string, onProgress?: (state: string) => void): Promise<GalaxyJob> {
    let attempts = 0;
    const maxAttempts = 300; // 10 minutes
    const intervalMs = 2000;

    while (attempts < maxAttempts) {
        const job = await this.getJob(jobId);
        
        if (onProgress) onProgress(job.state);
        
        console.log(`[Polling] Job ${jobId} status: ${job.state}`);
        
        if (job.state === 'ok') {
            return job;
        }
        if (job.state === 'error') {
            throw new Error(`Galaxy Job failed. State: ${job.state}`);
        }
        if (job.state === 'paused') {
             throw new Error(`Galaxy Job is paused by server.`);
        }
        
        await new Promise(resolve => setTimeout(resolve, intervalMs));
        attempts++;
    }
    throw new Error("Job polling timed out.");
  }
}