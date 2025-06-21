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

  it('getThreatScore fetches threat value', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ score: 42 }),
    })) as any);
    const { secureCoreService } = await import('../../services/secureCoreService');
    const res = await secureCoreService.getThreatScore();
    expect(fetch).toHaveBeenCalledWith('/api/securecore/threat');
    expect(res).toEqual({ score: 42 });
  });

  it('getThreatPrediction fetches predicted value', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ score: 33 }),
    })) as any);
    const { secureCoreService } = await import('../../services/secureCoreService');
    const res = await secureCoreService.getThreatPrediction();
    expect(fetch).toHaveBeenCalledWith('/api/securecore/threatpredict');
    expect(res).toEqual({ score: 33 });
  });
});
