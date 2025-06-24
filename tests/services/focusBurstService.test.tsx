import { describe, it, expect, beforeEach } from 'vitest';

beforeEach(async () => {
  const mod = await import('../../services/focusBurstService');
  mod.focusBurstService.stop();
});

describe('focusBurstService', () => {
  it('starts and stops the timer', async () => {
    const { focusBurstService } = await import('../../services/focusBurstService');
    focusBurstService.start(1, 1);
    let state = focusBurstService.getState();
    expect(state.phase).toBe('work');
    expect(state.secondsLeft).toBe(60);
    focusBurstService.stop();
    state = focusBurstService.getState();
    expect(state.phase).toBe('idle');
    expect(state.secondsLeft).toBe(0);
  });
});
