import { describe, it, expect, vi, beforeEach } from 'vitest';

let sendModelMessageStream: any;
let createModelSession: any;

vi.mock('../../services/modelManager', () => {
  sendModelMessageStream = vi.fn();
  createModelSession = vi.fn(() => ({}));
  return { sendModelMessageStream, createModelSession };
});

vi.mock('@tauri-apps/api/tauri', () => ({ invoke: vi.fn(() => Promise.resolve('ok')) }));

beforeEach(() => {
  vi.resetModules();
  sendModelMessageStream.mockReset();
  createModelSession.mockReset();
  createModelSession.mockReturnValue({});
});

describe('agentOrchestrator workflows', () => {
  it('processes sequential actions across services', async () => {
    sendModelMessageStream
      .mockImplementationOnce(async function* () {
        yield '{"action":"vault.copy","parameters":{"src":"a.txt","dest":"b.txt"}}';
      })
      .mockImplementationOnce(async function* () {
        yield '{"action":"timeai.add_event","parameters":{"id":1,"start":"s","end":"e"}}';
      });

    const { agentOrchestrator } = await import('../../services/agentOrchestrator');
    const task1 = await agentOrchestrator.processIntent('copy file');
    const { invoke } = await import('@tauri-apps/api/tauri');
    expect(invoke).toHaveBeenCalledWith('copy_file', { src: 'a.txt', dest: 'b.txt' });
    expect(task1?.status).toBe('completed');

    const task2 = await agentOrchestrator.processIntent('schedule event');
    expect(invoke).toHaveBeenCalledWith('save_event', { event: { id: 1, start: 's', end: 'e' } });
    expect(task2?.status).toBe('completed');
  });
});
