export interface InboxMessage {
  id: number;
  from: string;
  subject: string;
  body: string;
}

export interface ScoredInboxMessage extends InboxMessage {
  score: number;
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

  async scoreMessage(message: InboxMessage): Promise<number> {
    try {
      const labels = await tagText(`${message.subject}\n${message.body}`, [
        'important',
        'normal',
        'spam',
      ]);
      const top = labels[0];
      if (top === 'important') return 1;
      if (top === 'spam') return 0;
      return 0.5;
    } catch {
      return 0;
    }
  }

  async getScoredMessages(): Promise<ScoredInboxMessage[]> {
    const messages = await this.getMessages();
    const scored = await Promise.all(
      messages.map(async m => ({ ...m, score: await this.scoreMessage(m) }))
    );
    scored.sort((a, b) => b.score - a.score);
    return scored;
  }
}

import { agentOrchestrator } from './agentOrchestrator';
import { tagText } from './modelManager';

export const inboxAIService = new InboxAIService();

agentOrchestrator.registerAction('inbox.get_messages', () => inboxAIService.getMessages());
agentOrchestrator.registerAction('inbox.summarize', params => inboxAIService.summarizeMessage(Number(params?.id)));
