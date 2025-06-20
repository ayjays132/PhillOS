import { openDB, DBSchema } from 'idb';
import { invoke } from '@tauri-apps/api/tauri';

interface PredictDB extends DBSchema {
  fileAccess: {
    key: string;
    value: { path: string; count: number; lastAccess: number };
    indexes: { 'lastAccess': number };
  };
}

class PredictSyncService {
  private dbPromise = openDB<PredictDB>('predictSync', 1, {
    upgrade(db) {
      const store = db.createObjectStore('fileAccess', { keyPath: 'path' });
      store.createIndex('lastAccess', 'lastAccess');
    },
  });

  async recordAccess(path: string) {
    const db = await this.dbPromise;
    const existing = (await db.get('fileAccess', path)) || { path, count: 0, lastAccess: 0 };
    existing.count += 1;
    existing.lastAccess = Date.now();
    await db.put('fileAccess', existing);
  }

  async getRecentFiles(limit = 5): Promise<string[]> {
    const db = await this.dbPromise;
    const all = await db.getAll('fileAccess');
    all.sort((a, b) => b.lastAccess - a.lastAccess);
    return all.slice(0, limit).map(f => f.path);
  }

  async prefetchRecent(limit = 5) {
    const files = await this.getRecentFiles(limit);
    if (files.length) await invoke('prefetch_files', { paths: files });
  }
}

export const predictSyncService = new PredictSyncService();
