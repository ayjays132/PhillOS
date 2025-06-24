import { describe, it, expect, vi, beforeEach } from 'vitest';

const processCommand = vi.fn(async () => ({ action: 'open_app', parameters: { app: 'files' } }));

vi.mock('../../services/agentService', () => ({
  agentService: { processCommand }
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
    expect(processCommand).toHaveBeenCalled();
    expect(task?.action.action).toBe('open_app');
    expect(handler).toHaveBeenCalledWith({ app: 'files', params: { app: 'files' }, taskId: task!.id });
    agentOrchestrator.off('launch', handler);
  });
});
