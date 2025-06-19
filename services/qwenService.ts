import ollama from 'ollama/browser';
import { ChatMessage } from '../types';

const MODEL = 'qwen:1.7b';

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

export const createQwenChatSession = (history?: ChatMessage[]) => new QwenChatSession(history);
