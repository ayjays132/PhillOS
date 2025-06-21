import { describe, it, expect, vi, beforeEach } from 'vitest';

class MockWebSocket {
  static last: MockWebSocket | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  readyState = 1;
  constructor(url: string) { MockWebSocket.last = this; }
  close() { this.readyState = 3; this.onclose && this.onclose(); }
}

beforeEach(() => {
  vi.resetModules();
  (global as any).WebSocket = MockWebSocket as any;
  (global as any).location = { protocol: 'http:', host: 'test' };
});

describe('liveInsightsService agent actions', () => {
  it('emits data after subscribing', async () => {
    const processCommand = vi.fn(async () => ({ action: 'insights.subscribe' }));
    vi.mock('../../services/agentService', () => ({ agentService: { processCommand } }));

    const { agentOrchestrator } = await import('../../services/agentOrchestrator');
    await import('../../services/liveInsightsService');

    const complete = vi.fn();
    const dataHandler = vi.fn();
    agentOrchestrator.on('complete', complete);
    agentOrchestrator.on('data', dataHandler);

    await agentOrchestrator.processIntent('sub');
    await Promise.resolve();
    const token = complete.mock.calls[0][0].result as string;

    MockWebSocket.last!.onmessage!({ data: JSON.stringify({ energy: 1, tempo: 80 }) });
    expect(dataHandler).toHaveBeenCalledWith({ taskId: token, data: { energy: 1, tempo: 80 } });
  });

  it('stops emitting after unsubscribe', async () => {
    const processCommand = vi.fn()
      .mockResolvedValueOnce({ action: 'insights.subscribe' });
    vi.mock('../../services/agentService', () => ({ agentService: { processCommand } }));

    const { agentOrchestrator } = await import('../../services/agentOrchestrator');
    await import('../../services/liveInsightsService');

    const complete = vi.fn();
    const dataHandler = vi.fn();
    agentOrchestrator.on('complete', complete);
    agentOrchestrator.on('data', dataHandler);

    await agentOrchestrator.processIntent('sub');
    await Promise.resolve();
    const token = complete.mock.calls[0][0].result as string;

    processCommand.mockResolvedValueOnce({ action: 'insights.unsubscribe', parameters: { token } });
    await agentOrchestrator.processIntent('unsub');
    await Promise.resolve();

    dataHandler.mockClear();
    MockWebSocket.last!.onmessage!({ data: JSON.stringify({ energy: 0.5, tempo: 90 }) });
    expect(dataHandler).not.toHaveBeenCalled();
  });
});
