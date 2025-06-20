import { describe, it, expect, vi, beforeEach } from 'vitest';

let pipelineMock: any;
vi.mock('@xenova/transformers', () => {
  pipelineMock = vi.fn().mockResolvedValue(async () => ({ text: 'hello world' }));
  return {
    pipeline: vi.fn(() => pipelineMock()),
  };
});

beforeEach(() => {
  vi.resetModules();
});

describe('whisperService', () => {
  it('transcribes audio using whisper model', async () => {
    const { transcribe } = await import('../../services/whisperService');
    const result = await transcribe(new Blob());
    expect(result).toBe('hello world');
    expect(pipelineMock).toHaveBeenCalled();
  });

  it('caches the pipeline across calls', async () => {
    const { transcribe } = await import('../../services/whisperService');
    await transcribe(new Blob());
    await transcribe(new Blob());
    const { pipeline } = await import('@xenova/transformers');
    expect((pipeline as any).mock.calls.length).toBe(1);
  });
});
