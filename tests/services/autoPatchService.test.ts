import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('autoPatchService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('triggers update after idle period', async () => {
    vi.useFakeTimers();
    let cb: any = null;
    vi.doMock('../../services/pulseMonitorService', () => ({
      pulseMonitorService: { subscribe: (fn: any) => { cb = fn; return () => {}; } }
    }));
    const post = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', post as any);
    const { autoPatchService } = await import('../../services/autoPatchService');
    autoPatchService.start();
    for (let i = 0; i < 5; i++) {
      cb({ load: 0.1, memory: 0.1 });
      vi.advanceTimersByTime(60000);
    }
    expect(post).toHaveBeenCalled();
    autoPatchService.stop();
    vi.useRealTimers();
  });
});
