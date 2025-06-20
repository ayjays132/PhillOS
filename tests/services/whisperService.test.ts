import { describe, it, expect, vi, beforeEach } from 'vitest';

let spawnMock: any;
let spawnSyncMock: any;

vi.mock('child_process', () => {
  spawnMock = vi.fn(() => ({
    stdout: { on: (e: string, cb: (d: Buffer) => void) => { if (e === 'data') cb(Buffer.from('hello')); } },
    stderr: { on: vi.fn() },
    on: (e: string, cb: (code?: number) => void) => { if (e === 'close') cb(0); }
  }));
  spawnSyncMock = vi.fn(() => ({ status: 0 }));
  return { spawn: spawnMock, spawnSync: spawnSyncMock };
});

vi.mock('fs', () => ({
  promises: { writeFile: vi.fn(() => Promise.resolve()), unlink: vi.fn(() => Promise.resolve()) }
}));

vi.mock('os', () => ({ tmpdir: () => '/tmp' }));
vi.mock('path', () => ({ join: (...args: string[]) => args.join('/') }));
vi.mock('crypto', () => ({ randomUUID: () => '123' }));

beforeEach(() => {
  vi.resetModules();
});

describe('WhisperService', () => {
  it('detects availability', async () => {
    const { WhisperService } = await import('../../services/whisperService');
    expect(WhisperService.isAvailable()).toBe(true);
    expect(spawnSyncMock).toHaveBeenCalled();
  });

  it('transcribes audio via python', async () => {
    const { WhisperService } = await import('../../services/whisperService');
    const svc = new WhisperService();
    const text = await svc.transcribe(new Blob(['test']));
    expect(text).toBe('hello');
    expect(spawnMock).toHaveBeenCalled();
  });
});
