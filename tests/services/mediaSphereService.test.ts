import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('mediaSphereService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('analyzeVideo posts id and returns result', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ result: 'ok' }),
    })) as any);
    const { mediaSphereService } = await import('../../services/mediaSphereService');
    const res = await mediaSphereService.analyzeVideo(1);
    expect(fetch).toHaveBeenCalledWith('/api/mediasphere/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 1 }),
    });
    expect(res).toEqual({ result: 'ok' });
  });
});
