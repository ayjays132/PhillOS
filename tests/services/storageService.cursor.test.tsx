import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  (globalThis as any).localStorage = {
    getItem: vi.fn(() => 'mac'),
    setItem: vi.fn(),
  };
  (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ cursor: 'mac' }) }));
});

describe('storageService cursor style', () => {
  it('retrieves cursor style from localStorage', async () => {
    const { storageService } = await import('../../services/storageService');
    const style = await storageService.getCursorStyle();
    expect(style).toBe('mac');
  });

  it('stores cursor style', async () => {
    const { storageService } = await import('../../services/storageService');
    await storageService.setCursorStyle('default');
    expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith('phillos_cursor_style', 'default');
  });
});
