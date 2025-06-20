import { describe, it, expect, vi, beforeEach } from 'vitest';

interface StorageMock {
  [key: string]: string;
}

let storage: StorageMock;

beforeEach(() => {
  vi.resetModules();
  storage = {};
  (globalThis as any).localStorage = {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
    removeItem: vi.fn((key: string) => { delete storage[key]; }),
  };
});

describe('memoryService', () => {
  it('persists messages across sessions', async () => {
    const { memoryService } = await import('../../services/memoryService');
    memoryService.clearMessages();
    const msg = { id: '1', role: 'user', text: 'hello', timestamp: new Date() };
    memoryService.addMessage(msg);

    // Simulate a new session by resetting modules
    vi.resetModules();
    (globalThis as any).localStorage = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
    };

    const { memoryService: reloaded } = await import('../../services/memoryService');
    expect(reloaded.getMessages()).toEqual([msg]);
  });
});
