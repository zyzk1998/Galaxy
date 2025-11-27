import React, { useState, useEffect } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { SettingsModal } from './components/SettingsModal';
import { OllamaService } from './services/ollamaService';
import { GalaxyService } from './services/galaxyService';
import { AppConfig, Message, GalaxyHistory } from './types';
import { DEFAULT_OLLAMA_URL, DEFAULT_GALAXY_URL, DEFAULT_MODEL, SYSTEM_PROMPT } from './constants';

export default function App() {
  const [config, setConfig] = useState<AppConfig>({
    ollamaUrl: DEFAULT_OLLAMA_URL,
    ollamaModel: DEFAULT_MODEL,
    galaxyUrl: DEFAULT_GALAXY_URL,
    galaxyApiKey: ''
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // 新增: 专门用于显示后台任务状态的文本
  const [loadingStatus, setLoadingStatus] = useState<string>('');
  const [currentHistory, setCurrentHistory] = useState<GalaxyHistory | null>(null);

  useEffect(() => {
    setMessages([
        { role: 'system', content: SYSTEM_PROMPT }
    ]);
  }, []);

  const getOrCreateHistory = async (galaxy: GalaxyService) => {
    if (currentHistory) return currentHistory.id;
    
    try {
        const histories = await galaxy.getHistories();
        if (histories.length > 0) {
            setCurrentHistory(histories[0]);
            return histories[0].id;
        }
        const newHist = await galaxy.createHistory('LLM Agent Session ' + new Date().toISOString().split('T')[0]);
        setCurrentHistory(newHist);
        return newHist.id;
    } catch (e) {
        throw new Error("无法连接 Galaxy。请检查 API Key 和网络配置。");
    }
  };

  const handleSendMessage = async (userContent: string, systemContext?: string) => {
    if (!config.galaxyApiKey) {
        setMessages(prev => [...prev, { role: 'assistant', content: '请先在设置中配置 Galaxy API Key。', type: 'error' }]);
        setIsSettingsOpen(true);
        return;
    }

    setIsLoading(true);
    setLoadingStatus('Agent 正在思考...');
    
    let newMessages = [...messages];
    if (systemContext) {
        newMessages.push({ role: 'system', content: systemContext, type: 'info' });
    }
    newMessages.push({ role: 'user', content: userContent });
    setMessages(newMessages);

    try {
        const ollama = new OllamaService(config.ollamaUrl, config.ollamaModel);
        const galaxy = new GalaxyService(config.galaxyUrl, config.galaxyApiKey);

        // 1. LLM 决策
        const llmResponse = await ollama.chat(newMessages);
        
        let toolCall = null;
        let responseText = llmResponse;

        // JSON 提取
        const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const potentialTool = JSON.parse(jsonMatch[0]);
                if (potentialTool.tool) {
                    toolCall = potentialTool;
                    responseText = llmResponse.replace(jsonMatch[0], '').trim();
                    if (!responseText) responseText = `好的，我将调用 ${toolCall.tool} 工具来处理您的请求。`;
                }
            } catch (e) {
                console.warn("JSON Parse Error", e);
            }
        }

        const assistantMsg: Message = { 
            role: 'assistant', 
            content: responseText,
            type: toolCall ? 'tool_call' : 'text'
        };
        
        let updatedMessages = [...newMessages, assistantMsg];
        setMessages(updatedMessages);

        // 2. 工具执行与等待
        if (toolCall) {
            const historyId = await getOrCreateHistory(galaxy);

            if (toolCall.tool === 'get_histories') {
                setLoadingStatus('正在查询历史记录...');
                const hists = await galaxy.getHistories();
                const resultMsg: Message = {
                    role: 'system',
                    content: `历史记录: \n${hists.map(h => `- ${h.name}`).join('\n')}`,
                    type: 'tool_result'
                };
                setMessages(prev => [...prev, resultMsg]);
            } else {
                // 发送任务到 Galaxy
                setLoadingStatus(`正在向 Galaxy 发送请求 (${toolCall.tool})...`);
                const runRes = await galaxy.runTool(toolCall.tool, toolCall.parameters, historyId);
                const jobId = runRes.jobs[0].id;

                // 轮询等待
                setLoadingStatus(`Galaxy 正在处理数据... (Job ID: ${jobId})\n请耐心等待，结果将自动显示。`);
                
                const finishedJob = await galaxy.waitForJob(jobId, (state) => {
                     setLoadingStatus(`Galaxy 任务运行中... [${state.toUpperCase()}]`);
                });
                
                let resultDetails = `任务完成 (状态: ${finishedJob.state})。`;
                if (finishedJob.outputs && finishedJob.outputs.length > 0) {
                     const outId = finishedJob.outputs[0].id;
                     resultDetails += `\n输出 Dataset ID: ${outId}`;
                }

                const resultMsg: Message = {
                    role: 'system',
                    content: `[Galaxy 返回结果]: ${resultDetails}`,
                    type: 'tool_result'
                };
                setMessages(prev => [...prev, resultMsg]);
            }
        }
    } catch (error: any) {
        setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `Error: ${error.message}`,
            type: 'error'
        }]);
    } finally {
        setIsLoading(false);
        setLoadingStatus('');
    }
  };

  const handleFileUpload = async (file: File) => {
      if (!config.galaxyApiKey) {
          setMessages(prev => [...prev, { role: 'assistant', content: '请先配置 Galaxy API Key。', type: 'error' }]);
          setIsSettingsOpen(true);
          return;
      }

      setIsLoading(true);
      setLoadingStatus('正在读取并上传文件到 Galaxy...');
      setMessages(prev => [...prev, { role: 'user', content: `[文件操作] 上传文件: ${file.name}`, type: 'text' }]);

      try {
          const galaxy = new GalaxyService(config.galaxyUrl, config.galaxyApiKey);
          const historyId = await getOrCreateHistory(galaxy);

          const reader = new FileReader();
          reader.onload = async (e) => {
              const content = e.target?.result as string;
              try {
                  const uploadRes = await galaxy.uploadData(historyId, content, file.name);
                  const outputs = uploadRes.outputs || [];
                  const datasetId = outputs[0]?.id || 'unknown';

                  setIsLoading(false);
                  setLoadingStatus('');
                  
                  const systemContext = `[系统通知]: 用户上传文件 "${file.name}" 成功。Dataset ID 为 "${datasetId}"。`;
                  const userPrompt = `文件 ${file.name} (ID: ${datasetId}) 已上传。请告诉我接下来可以做什么？`;
                  
                  handleSendMessage(userPrompt, systemContext);

              } catch (uploadError: any) {
                  setMessages(prev => [...prev, { role: 'assistant', content: `上传失败: ${uploadError.message}`, type: 'error' }]);
                  setIsLoading(false);
                  setLoadingStatus('');
              }
          };
          reader.readAsText(file);
      } catch (err: any) {
          setMessages(prev => [...prev, { role: 'assistant', content: `读取失败: ${err.message}`, type: 'error' }]);
          setIsLoading(false);
          setLoadingStatus('');
      }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-galaxy-primary font-bold text-lg">
            <i className="fas fa-dna"></i>
            <span>Galaxy Orchestrator</span>
          </div>
        </div>
        <div className="flex-1 p-4 text-sm text-gray-400">
          <p className="mb-4">Backend: 192.168.32.31</p>
          <p>Model: {config.ollamaModel}</p>
        </div>
        <div className="p-4 border-t border-gray-800">
          <button onClick={() => setIsSettingsOpen(true)} className="w-full bg-gray-800 py-2 rounded">
            <i className="fas fa-cog mr-2"></i> Settings
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
         <ChatInterface 
            messages={messages.filter(m => m.role !== 'system' && m.type !== 'info')} 
            isLoading={isLoading}
            loadingText={loadingStatus}
            onSendMessage={(msg) => handleSendMessage(msg)}
            onFileUpload={handleFileUpload}
         />
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={setConfig}
      />
    </div>
  );
}