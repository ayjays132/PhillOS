import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
});

describe('diagnosticService', () => {
  it('fetches diagnostics status', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ cpu: 0.5, memory: 0.25, uptime: 60 })
    })) as any);
    const { diagnosticService } = await import('../../services/diagnosticService');
    const status = await diagnosticService.getStatus();
    expect(fetch).toHaveBeenCalledWith('/api/diagnostics');
    expect(status.cpu).toBe(0.5);
    expect(status.memory).toBe(0.25);
    expect(status.uptime).toBe(60);
  });
});
