import React, { useState } from 'react';
import { AppConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<AppConfig>(config);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 p-6 rounded-lg w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-galaxy-primary">Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1 font-bold">Ollama URL</label>
            <input
              type="text"
              name="ollamaUrl"
              value={formData.ollamaUrl}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:border-galaxy-accent focus:outline-none focus:ring-1 focus:ring-galaxy-accent"
              placeholder="http://localhost:11434"
            />
            <p className="text-xs text-yellow-600 mt-1">
              * Ensure <code>OLLAMA_ORIGINS="*"</code> is set on your server.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1 font-bold">Ollama Model</label>
            <input
              type="text"
              name="ollamaModel"
              value={formData.ollamaModel}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:border-galaxy-accent focus:outline-none focus:ring-1 focus:ring-galaxy-accent"
              placeholder="gpt-oss:120b"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1 font-bold">Galaxy URL</label>
            <input
              type="text"
              name="galaxyUrl"
              value={formData.galaxyUrl}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:border-galaxy-accent focus:outline-none focus:ring-1 focus:ring-galaxy-accent"
              placeholder="https://usegalaxy.org"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1 font-bold">Galaxy API Key</label>
            <input
              type="password"
              name="galaxyApiKey"
              value={formData.galaxyApiKey}
              onChange={handleChange}
              className="w-full bg-gray-50 border border-gray-300 rounded p-2 text-gray-800 focus:border-galaxy-accent focus:outline-none focus:ring-1 focus:ring-galaxy-accent"
              placeholder="Your Galaxy User API Key"
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in User Preferences {'>'} Manage API Key
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:text-gray-800">Cancel</button>
          <button 
            onClick={() => { onSave(formData); onClose(); }} 
            className="px-4 py-2 bg-galaxy-primary hover:bg-purple-700 rounded text-white font-medium shadow-sm"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};