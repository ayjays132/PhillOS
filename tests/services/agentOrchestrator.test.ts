import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/agentService', () => ({
  agentService: {
    processCommand: vi.fn(async () => ({ action: 'open_app', parameters: { app: 'files' } }))
  }
}));

beforeEach(() => {
  vi.resetModules();
});

describe('agentOrchestrator', () => {
  it('emits launch event when intent opens an app', async () => {
    const { agentOrchestrator } = await import('../../services/agentOrchestrator');
    const handler = vi.fn();
    agentOrchestrator.on('launch', handler);
    const task = await agentOrchestrator.processIntent('open files');
    expect(task?.action.action).toBe('open_app');
    expect(handler).toHaveBeenCalledWith({ app: 'files', params: { app: 'files' }, taskId: task!.id });
    agentOrchestrator.off('launch', handler);
  });
});
