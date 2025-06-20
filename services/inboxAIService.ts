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

  async chainShrink(id: number): Promise<string> {
    const messages = await this.getMessages();
    const msg = messages.find(m => m.id === id);
    if (!msg) return '';
    let text = msg.body;
    while (text.length > 200) {
      text = await summarize(text);
    }
    return text;
  }

  private parseInvite(body: string): CalendarEvent | null {
    const start = body.match(/DTSTART[^:]*:(\d{8}T\d{6}Z?)/);
    const end = body.match(/DTEND[^:]*:(\d{8}T\d{6}Z?)/);
    const summary = body.match(/SUMMARY:(.+)/);
    if (start && end && summary) {
      const toIso = (s: string) => {
        const y = s.slice(0, 4);
        const m = s.slice(4, 6);
        const d = s.slice(6, 8);
        const h = s.slice(9, 11);
        const min = s.slice(11, 13);
        return `${y}-${m}-${d}T${h}:${min}:00${s.endsWith('Z') ? 'Z' : ''}`;
      };
      return {
        id: 0,
        title: summary[1].trim(),
        start: toIso(start[1]),
        end: toIso(end[1]),
      };
    }
    return null;
  }

  async extractMeeting(id: number): Promise<CalendarEvent | null> {
    const messages = await this.getMessages();
    const msg = messages.find(m => m.id === id);
    if (!msg) return null;
    const event = this.parseInvite(msg.body);
    if (!event) return null;
    try {
      await invoke('save_event', { event });
    } catch {
      // ignore
    }
    return event;
  }
}

import { agentOrchestrator } from './agentOrchestrator';
import { tagText, summarize } from './modelManager';
import { invoke } from '@tauri-apps/api/tauri';
import { CalendarEvent } from '../src/types';

export const inboxAIService = new InboxAIService();

agentOrchestrator.registerAction('inbox.get_messages', () => inboxAIService.getMessages());
agentOrchestrator.registerAction('inbox.summarize', params => inboxAIService.summarizeMessage(Number(params?.id)));
agentOrchestrator.registerAction('inbox.condense_thread', params => inboxAIService.chainShrink(Number(params?.id)));
agentOrchestrator.registerAction('inbox.extract_meeting', params => inboxAIService.extractMeeting(Number(params?.id)));
