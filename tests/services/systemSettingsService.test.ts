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

  it('fetches app permissions', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ permissions: { camera: true } }),
        })
      ) as any
    );
    const { systemSettingsService } = await import('../../services/systemSettingsService');
    const perms = await systemSettingsService.getPermissions();
    expect(fetch).toHaveBeenCalledWith('/api/permissions');
    expect(perms).toEqual({ camera: true });
  });

  it('updates a permission', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve({ ok: true })) as any
    );
    const { systemSettingsService } = await import('../../services/systemSettingsService');
    await systemSettingsService.setPermission('camera', false);
    expect(fetch).toHaveBeenCalledWith('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: 'camera', granted: false }),
    });
  });
});
