import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';

beforeEach(async () => {
  indexedDB.deleteDatabase('predictSync');
  vi.resetModules();
});

describe('predictSyncService', () => {
  it('records and returns recent files', async () => {
    const { predictSyncService } = await import('../../services/predictSyncService');
    await predictSyncService.recordAccess('a.txt');
    const recent = await predictSyncService.getRecentFiles(1);
    expect(recent).toEqual(['a.txt']);
  });
});
