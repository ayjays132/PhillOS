import { invoke } from '@tauri-apps/api/tauri';
import { BrainPadEntry } from './brainPadService';
import { CalendarEvent } from '../src/types';

class NoteLinkService {
  async linkNotes(entries: BrainPadEntry[]): Promise<Record<number, CalendarEvent[]>> {
    try {
      const events = await invoke<CalendarEvent[]>('load_events');
      const map: Record<number, CalendarEvent[]> = {};
      for (const e of entries) {
        const matches = events.filter(ev => {
          const noteDate = new Date(e.timestamp).toISOString().slice(0, 10);
          const evDate = ev.start.slice(0, 10);
          const sameDay = noteDate === evDate;
          const mention = e.content.toLowerCase().includes(ev.title.toLowerCase());
          return sameDay || mention;
        });
        if (matches.length) map[e.timestamp] = matches;
      }
      return map;
    } catch {
      return {};
    }
  }
}

export const noteLinkService = new NoteLinkService();
