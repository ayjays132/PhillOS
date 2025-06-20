import { CalendarEvent } from '../src/types';
import { invoke } from '@tauri-apps/api/tauri';

class TimeAIService {
  async getEvents(): Promise<CalendarEvent[]> {
    return invoke<CalendarEvent[]>('load_events');
  }

  async saveEvent(event: CalendarEvent): Promise<number> {
    return invoke<number>('save_event', { event });
  }

  async smartSlot(tasks: string[]): Promise<string> {
    const payload = JSON.stringify({ tasks });
    return invoke<string>('call_scheduler', { action: 'smart_slot', payload });
  }

  async reschedule(events: CalendarEvent[]): Promise<string> {
    const payload = JSON.stringify({ events });
    return invoke<string>('call_scheduler', { action: 'reschedule', payload });
  }
}

export const timeaiService = new TimeAIService();
