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

  it('fetches storage stats', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ stats: { total: 1000, free: 500 } }),
        })
      ) as any,
    );
    const { systemSettingsService } = await import('../../services/systemSettingsService');
    const stats = await systemSettingsService.getStorageStats();
    expect(fetch).toHaveBeenCalledWith('/api/storage/stats');
    expect(stats).toEqual({ total: 1000, free: 500 });
  });

  it('fetches battery info', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ battery: { level: 0.4, charging: false } }),
        })
      ) as any,
    );
    const { systemSettingsService } = await import('../../services/systemSettingsService');
    const info = await systemSettingsService.getBatteryInfo();
    expect(fetch).toHaveBeenCalledWith('/api/power/battery');
    expect(info).toEqual({ level: 0.4, charging: false });
  });

  it('fetches power profile', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ profile: 'performance' }),
        })
      ) as any,
    );
    const { systemSettingsService } = await import('../../services/systemSettingsService');
    const profile = await systemSettingsService.getPowerProfile();
    expect(fetch).toHaveBeenCalledWith('/api/power/profile');
    expect(profile).toBe('performance');
  });

  it('updates power profile', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })) as any);
    const { systemSettingsService } = await import('../../services/systemSettingsService');
    await systemSettingsService.setPowerProfile('balanced');
    expect(fetch).toHaveBeenCalledWith('/api/power/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profile: 'balanced' }),
    });
  });

  it('fetches network stats', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ stats: [{ name: 'eth0', rx: 1, tx: 2 }] })
    })) as any);
    const { systemSettingsService } = await import('../../services/systemSettingsService');
    const stats = await systemSettingsService.getNetworkStats();
    expect(fetch).toHaveBeenCalledWith('/api/network/stats');
    expect(stats?.[0].name).toBe('eth0');
  });

  it('sets tethering', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })) as any);
    const { systemSettingsService } = await import('../../services/systemSettingsService');
    await systemSettingsService.setTethering(true);
    expect(fetch).toHaveBeenCalledWith('/api/network/tethering', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tethering: true }),
    });
  });
});
