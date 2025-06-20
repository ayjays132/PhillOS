import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modelManager before importing the service
let createModelSession: any;
let sendModelMessageStream: any;

vi.mock('../../services/modelManager', () => {
  createModelSession = vi.fn().mockResolvedValue({ type: 'local' } as any);
  sendModelMessageStream = vi.fn();
  return {
    createModelSession,
    sendModelMessageStream,
  };
});

beforeEach(async () => {
  vi.resetModules();
  (globalThis as any).localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
});

describe('agentService', () => {
  it('initializes model session with history', async () => {
    const { memoryService } = await import('../../services/memoryService');
    memoryService.clearMessages();
    const msg = { id: '1', role: 'user', text: 'hi', timestamp: new Date() };
    memoryService.addMessage(msg);

    const { agentService } = await import('../../services/agentService');
    await agentService.init('local');

    expect(createModelSession).toHaveBeenCalledWith('local', {
      history: [msg],
    });
  });

  it('processCommand parses model response', async () => {
    sendModelMessageStream.mockImplementation(() => (async function* () {
      yield '{"action":"open_app","parameters":{"app":"files"}}';
    })());

    const { agentService } = await import('../../services/agentService');
    const result = await agentService.processCommand('open files', 'local', ['open_app']);

    expect(sendModelMessageStream).toHaveBeenCalled();
    expect(result).toEqual({ action: 'open_app', parameters: { app: 'files' } });
  });
});
