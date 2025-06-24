import { createCloudChatSession, sendMessageStream, CloudProvider } from './cloudAIService';
import { agentOrchestrator } from './agentOrchestrator';

export interface BrainPadEntry {
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'phillos_brainpad_entries_v1';

class BrainPadService {
  private entries: BrainPadEntry[] = [];
  private msgHandler = (e: MessageEvent) => {
    const data = e.data;
    if (data && data.type === 'brainpad.snippet') {
      this.addEntry(String(data.content || ''));
    }
  };

  init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as BrainPadEntry[];
        if (Array.isArray(data)) this.entries = data;
      }
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('message', this.msgHandler);
    }
  }

  async summarize(content: string, apiKey: string, provider: CloudProvider = 'gemini'): Promise<string[]> {
    try {
      const session = await createCloudChatSession(provider, apiKey);
      if (!session) return [];
      let text = '';
      for await (const chunk of sendMessageStream(session, `Summarize the following note into concise bullet points:\n${content}`)) {
        text += chunk;
      }
      return text
        .split(/\n+/)
        .map(l => l.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  getEntries(): BrainPadEntry[] {
    return [...this.entries];
  }

  addEntry(content: string) {
    this.entries.push({ content, timestamp: Date.now() });
    this.persist();
  }

  clear() {
    this.entries = [];
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries));
    } catch {
      // ignore
    }
  }

  postSnippet(content: string) {
    if (typeof window !== 'undefined' && window.postMessage) {
      window.postMessage({ type: 'brainpad.snippet', content }, '*');
    }
  }

  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', this.msgHandler);
    }
  }
}

export const brainPadService = new BrainPadService();

agentOrchestrator.registerAction('brainpad.add_entry', params => {
  return brainPadService.addEntry(String(params?.content || ''));
});

agentOrchestrator.registerAction('brainpad.get_entries', () => {
  return brainPadService.getEntries();
});

agentOrchestrator.registerAction('brainpad.clear', () => {
  brainPadService.clear();
});
