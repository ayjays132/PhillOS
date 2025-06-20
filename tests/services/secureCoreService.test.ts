import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('secureCoreService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('getStatus fetches firewall state', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ firewall: true }),
    })) as any);
    const { secureCoreService } = await import('../../services/secureCoreService');
    const res = await secureCoreService.getStatus();
    expect(fetch).toHaveBeenCalledWith('/api/securecore/status');
    expect(res).toEqual({ firewall: true });
  });

  it('toggleFirewall posts to API', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ firewall: false }),
    })) as any);
    const { secureCoreService } = await import('../../services/secureCoreService');
    const res = await secureCoreService.toggleFirewall();
    expect(fetch).toHaveBeenCalledWith('/api/securecore/toggle', { method: 'POST' });
    expect(res).toEqual({ firewall: false });
  });
});
