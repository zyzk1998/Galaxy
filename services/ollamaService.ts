import { Message, OllamaResponse } from '../types';

export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async chat(messages: Message[]): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false, 
          // Suggesting JSON mode if the prompt expects structured output, 
          // but keeping it flexible here as we mix text and JSON in the prompt instructions
          format: 'json' 
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API Error: ${response.statusText}`);
      }

      const data: OllamaResponse = await response.json();
      return data.message.content;
    } catch (error) {
      console.error("Ollama connection failed. Ensure OLLAMA_ORIGINS='*' is set.", error);
      throw error;
    }
  }
}