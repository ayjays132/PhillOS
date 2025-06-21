import { describe, it, expect, vi, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(() => Promise.resolve()),
}));

beforeEach(async () => {
  indexedDB.deleteDatabase('predictSync');
  vi.resetModules();
});

describe('autoCleanService', () => {
  it('suggests files not accessed recently', async () => {
    const { predictSyncService } = await import('../../services/predictSyncService');
    await predictSyncService.recordAccess('old.txt');
    await predictSyncService.recordAccess('new.txt');
    const { openDB } = await import('idb');
    const db = await openDB('predictSync', 1);
    const entry = await db.get('fileAccess', 'old.txt');
    entry!.lastAccess -= 31 * 24 * 60 * 60 * 1000;
    await db.put('fileAccess', entry!);

    const { autoCleanService } = await import('../../services/autoCleanService');
    const list = await autoCleanService.getSuggestions();
    expect(list).toEqual(['old.txt']);
  });

  it('invokes backend commands', async () => {
    const { autoCleanService } = await import('../../services/autoCleanService');
    const { invoke } = await import('@tauri-apps/api/tauri');
    await autoCleanService.archive('a');
    await autoCleanService.delete('b');
    expect(invoke).toHaveBeenCalledWith('archive_file', { path: 'a' });
    expect(invoke).toHaveBeenCalledWith('delete_file', { path: 'b' });
  });
});
