import { tagText } from './modelManager';
import { agentOrchestrator } from './agentOrchestrator';
import { InboxMessage, ScoredInboxMessage } from './inboxAIService';

class InboxPriorityService {
  async scoreInbox(): Promise<void> {
    try {
      const res = await fetch('/api/inboxai/messages');
      if (!res.ok) return;
      const data = await res.json();
      const messages: InboxMessage[] = data.messages || [];
      for (const m of messages) {
        const labels = await tagText(`${m.subject}\n${m.body}`, [
          'important',
          'normal',
          'spam',
        ]);
        const top = labels[0];
        let score = 0.5;
        if (top === 'important') score = 1;
        else if (top === 'spam') score = 0;
        await fetch('/api/inboxai/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: m.id, score }),
        });
      }
    } catch {
      // ignore
    }
  }

  async getPriorityList(): Promise<ScoredInboxMessage[]> {
    try {
      const res = await fetch('/api/inboxai/messages-sorted');
      if (!res.ok) return [];
      const data = await res.json();
      return data.messages || [];
    } catch {
      return [];
    }
  }
}

export const inboxPriorityService = new InboxPriorityService();

agentOrchestrator.registerAction('inbox.priority_list', () =>
  inboxPriorityService.getPriorityList(),
);
