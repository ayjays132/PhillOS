import ollama from 'ollama/browser';
import { ChatMessage } from '../types';

// Allow overriding the local model via Vite env variable.
// Default to the Qwen3-1.7B model as recommended in the design docs.
const MODEL = import.meta.env.VITE_LOCAL_AI_MODEL || 'qwen3:1.7b';
const OLLAMA_URL = 'http://localhost:11434';

export const verifyOllamaAvailable = async () => {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/version`);
    if (!res.ok) throw new Error('Server responded with status ' + res.status);
  } catch (err) {
    throw new Error('Ollama server not reachable');
  }
};

export class QwenChatSession {
  private history: { role: 'user' | 'assistant' | 'system'; content: string }[] = [];

  constructor(initialHistory?: ChatMessage[]) {
    if (initialHistory) {
      this.history = initialHistory.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.text,
      }));
    }
  }

  async *sendMessageStream(message: string) {
    const messages = [...this.history, { role: 'user' as const, content: message }];
    this.history.push({ role: 'user', content: message });
    const response = await ollama.chat({ model: MODEL, messages, stream: true });
    let assistantText = '';
    for await (const part of response) {
      const content = part.message?.content || '';
      assistantText += content;
      yield content;
    }
    this.history.push({ role: 'assistant', content: assistantText });
  }
}

export const createQwenChatSession = async (history?: ChatMessage[]) => {
  await verifyOllamaAvailable();
  return new QwenChatSession(history);
};
