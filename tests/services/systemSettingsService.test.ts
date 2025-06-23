import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('systemSettingsService', () => {
  it('fetches storage usage', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ usage: { files: 100 } })
    })) as any);
    const { systemSettingsService } = await import('../../services/systemSettingsService');
    const usage = await systemSettingsService.getStorageUsage();
    expect(fetch).toHaveBeenCalledWith('/api/storage/usage');
    expect(usage).toEqual({ files: 100 });
  });
});
