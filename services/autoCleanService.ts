import { openDB, DBSchema } from 'idb';
import { invoke } from '@tauri-apps/api/tauri';
import { predictSyncService } from './predictSyncService';
import { agentOrchestrator } from './agentOrchestrator';

interface PredictDB extends DBSchema {
  fileAccess: {
    key: string;
    value: { path: string; count: number; lastAccess: number };
    indexes: { 'lastAccess': number };
  };
}

class AutoCleanService {
  private dbPromise = openDB<PredictDB>('predictSync', 1, {
    upgrade(db) {
      const store = db.createObjectStore('fileAccess', { keyPath: 'path' });
      store.createIndex('lastAccess', 'lastAccess');
    },
  });
  private thresholdMs = 30 * 24 * 60 * 60 * 1000; // default 30 days

  setThreshold(days: number) {
    this.thresholdMs = days * 24 * 60 * 60 * 1000;
  }

  async getSuggestions(): Promise<string[]> {
    // ensure DB is initialised
    await predictSyncService.getRecentFiles(1);
    const db = await this.dbPromise;
    const all = await db.getAll('fileAccess');
    const now = Date.now();
    return all
      .filter(f => now - f.lastAccess > this.thresholdMs)
      .map(f => f.path);
  }

  async archive(path: string) {
    await invoke('archive_file', { path });
  }

  async delete(path: string) {
    await invoke('delete_file', { path });
  }
}

export const autoCleanService = new AutoCleanService();

agentOrchestrator.registerAction('autoclean.suggest', () => autoCleanService.getSuggestions());
