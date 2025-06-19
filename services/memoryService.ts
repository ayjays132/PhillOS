import { ChatMessage } from '../types';

const STORAGE_KEY = 'phillos_message_history_v1';

class MemoryService {
  private messages: ChatMessage[] = [];
  private limit = 50;

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed)) {
          this.messages = parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      }
    } catch {
      this.messages = [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.messages));
    } catch {
      // ignore
    }
  }

  private trim() {
    if (this.messages.length > this.limit) {
      this.messages.splice(0, this.messages.length - this.limit);
    }
  }

  addMessage(msg: ChatMessage) {
    this.messages.push({ ...msg });
    this.trim();
    this.persist();
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  clearMessages() {
    this.messages = [];
    this.persist();
  }

  setLimit(limit: number) {
    this.limit = limit;
    this.trim();
    this.persist();
  }
}

export const memoryService = new MemoryService();
