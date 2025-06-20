import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn(() => Promise.resolve('ok'));

beforeEach(() => {
  vi.resetModules();
  invoke.mockClear();
});

describe('TimeAI frontend integration', () => {
  it('schedules tasks using backend', async () => {
    vi.doMock('@tauri-apps/api/tauri', () => ({ invoke }));
    const { timeaiService } = await import('../../services/timeaiService');
    const tasks = ['a', 'b'];
    await timeaiService.smartSlot(tasks);
    expect(invoke).toHaveBeenCalledWith('call_scheduler', { action: 'smart_slot', payload: JSON.stringify({ tasks }) });
  });
});
