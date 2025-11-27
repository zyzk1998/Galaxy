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
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 border border-gray-700 p-6 rounded-lg w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-galaxy-primary">Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ollama URL</label>
            <input
              type="text"
              name="ollamaUrl"
              value={formData.ollamaUrl}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-galaxy-accent focus:outline-none"
              placeholder="http://localhost:11434"
            />
            <p className="text-xs text-yellow-500 mt-1">
              * Ensure <code>OLLAMA_ORIGINS="*"</code> is set on your server.
            </p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Ollama Model</label>
            <input
              type="text"
              name="ollamaModel"
              value={formData.ollamaModel}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-galaxy-accent focus:outline-none"
              placeholder="gpt-oss:120b"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Galaxy URL</label>
            <input
              type="text"
              name="galaxyUrl"
              value={formData.galaxyUrl}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-galaxy-accent focus:outline-none"
              placeholder="https://usegalaxy.org"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Galaxy API Key</label>
            <input
              type="password"
              name="galaxyApiKey"
              value={formData.galaxyApiKey}
              onChange={handleChange}
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-galaxy-accent focus:outline-none"
              placeholder="Your Galaxy User API Key"
            />
            <p className="text-xs text-gray-500 mt-1">
              Found in User Preferences {'>'} Manage API Key
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-300 hover:text-white">Cancel</button>
          <button 
            onClick={() => { onSave(formData); onClose(); }} 
            className="px-4 py-2 bg-galaxy-primary hover:bg-purple-600 rounded text-white font-medium"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};