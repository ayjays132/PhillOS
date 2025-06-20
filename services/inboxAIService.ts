export interface InboxMessage {
  id: number;
  from: string;
  subject: string;
  body: string;
}

class InboxAIService {
  async getMessages(): Promise<InboxMessage[]> {
    try {
      const res = await fetch('/api/inboxai/messages');
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages || [];
    } catch {
      return [];
    }
  }

  async summarizeMessage(id: number): Promise<string> {
    try {
      const res = await fetch('/api/inboxai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) return '';
      const data = await res.json();
      return data.summary || '';
    } catch {
      return '';
    }
  }
}

import { agentOrchestrator } from './agentOrchestrator';

export const inboxAIService = new InboxAIService();

agentOrchestrator.registerAction('inbox.get_messages', () => inboxAIService.getMessages());
agentOrchestrator.registerAction('inbox.summarize', params => inboxAIService.summarizeMessage(Number(params?.id)));
