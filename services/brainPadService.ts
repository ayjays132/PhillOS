export interface BrainPadEntry {
  content: string;
  timestamp: number;
}

const STORAGE_KEY = 'phillos_brainpad_entries_v1';

class BrainPadService {
  private entries: BrainPadEntry[] = [];

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
}

export const brainPadService = new BrainPadService();
