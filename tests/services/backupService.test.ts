import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('backupService', () => {
  it('exports settings', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ settings: { foo: 1 } })
    })) as any);
    const { backupService } = await import('../../services/backupService');
    const data = await backupService.exportSettings();
    expect(fetch).toHaveBeenCalledWith('/api/settings');
    expect(data.foo).toBe(1);
  });

  it('imports settings', async () => {
    const post = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', post as any);
    const { backupService } = await import('../../services/backupService');
    const ok = await backupService.importSettings({ bar: 2 });
    expect(post).toHaveBeenCalledWith('/api/settings', expect.objectContaining({ method: 'POST' }));
    expect(ok).toBe(true);
  });
});
