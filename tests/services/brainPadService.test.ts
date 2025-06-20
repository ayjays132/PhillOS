import { describe, it, expect, vi, beforeEach } from 'vitest';

let listeners: Record<string, (e: any) => void>;
let storage: Record<string, string>;

beforeEach(() => {
  vi.resetModules();
  listeners = {};
  storage = {};
  (global as any).window = {
    addEventListener: vi.fn((ev: string, cb: any) => {
      listeners[ev] = cb;
    }),
    removeEventListener: vi.fn(),
    postMessage: vi.fn((data: any) => {
      listeners['message'] && listeners['message']({ data });
    }),
  };
  (global as any).localStorage = {
    getItem: vi.fn((k: string) => storage[k] || null),
    setItem: vi.fn((k: string, v: string) => {
      storage[k] = v;
    }),
    removeItem: vi.fn((k: string) => {
      delete storage[k];
    }),
  };
});

describe('brainPadService message API', () => {
  it('appends snippets via postMessage', async () => {
    const { brainPadService } = await import('../../services/brainPadService');
    brainPadService.init();
    brainPadService.postSnippet('hello');
    const entries = brainPadService.getEntries();
    expect(entries[entries.length - 1].content).toBe('hello');
  });

  it('summarizes notes with cloudAIService', async () => {
    vi.doMock('../../services/cloudAIService', () => ({
      createCloudChatSession: vi.fn(async () => ({ provider: 'gemini', apiKey: 'k', session: {} })),
      sendMessageStream: vi.fn(async function* () {
        yield 'Bullet one\nBullet two';
      }),
    }));
    const { brainPadService } = await import('../../services/brainPadService');
    const bullets = await brainPadService.summarize('test note', 'k');
    expect(bullets).toEqual(['Bullet one', 'Bullet two']);
  });
});
