import React, { useRef, useEffect } from 'react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  loadingText?: string;
  onSendMessage: (content: string) => void;
  onFileUpload: (file: File) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, isLoading, loadingText, onSendMessage, onFileUpload }) => {
  const [input, setInput] = React.useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
                <i className="fas fa-dna text-6xl mb-4"></i>
                <p>Galaxy 编排助手</p>
                <p className="text-sm">请上传文件或输入指令</p>
            </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-galaxy-primary text-white rounded-br-none shadow-md' 
                  : msg.type === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <i className={`fas ${msg.role === 'user' ? 'fa-user' : 'fa-robot'} text-xs opacity-50`}></i>
                <span className="text-xs font-bold uppercase opacity-50">{msg.role}</span>
              </div>
              
              {msg.type === 'tool_call' ? (
                 <div className="font-mono text-sm bg-gray-100 p-2 rounded border-l-2 border-galaxy-accent">
                    <div className="text-galaxy-accent mb-1 flex items-center gap-2">
                        <i className="fas fa-terminal"></i> 调用工具
                    </div>
                    <div className="whitespace-pre-wrap text-gray-700">{msg.content}</div>
                 </div>
              ) : msg.type === 'tool_result' ? (
                 <div className="font-mono text-sm bg-green-50 p-2 rounded border-l-2 border-green-500">
                    <div className="text-green-600 mb-1 flex items-center gap-2">
                         <i className="fas fa-check-circle"></i> 执行结果
                    </div>
                    <div className="whitespace-pre-wrap text-gray-700">{msg.content}</div>
                 </div>
              ) : (
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="bg-white p-4 rounded-xl rounded-bl-none border border-galaxy-accent/30 w-full max-w-md shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-galaxy-accent rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-galaxy-accent rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-galaxy-accent rounded-full animate-bounce delay-150"></div>
                    <span className="text-galaxy-accent font-bold text-sm">SYSTEM PROCESSING</span>
                </div>
                <div className="text-sm text-gray-500 font-mono whitespace-pre-wrap animate-pulse">
                    {loadingText || '正在处理中...'}
                </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
           <input 
             type="file" 
             ref={fileInputRef} 
             className="hidden" 
             onChange={handleFileChange}
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="p-3 text-gray-400 hover:text-galaxy-accent transition-colors"
             title="Upload to Galaxy"
             disabled={isLoading}
           >
             <i className="fas fa-paperclip"></i>
           </button>
           
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="输入指令 (例如: '过滤包含 chr1 的行')..."
            className="flex-1 bg-gray-50 text-gray-800 rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-galaxy-primary border border-gray-200 disabled:opacity-50"
            rows={1}
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-3 rounded-lg transition-all ${
              isLoading || !input.trim() 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-galaxy-primary text-white hover:bg-purple-600 shadow-md'
            }`}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
};