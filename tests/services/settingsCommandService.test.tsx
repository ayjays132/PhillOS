import { describe, it, expect, beforeEach, vi } from 'vitest';

let storageMock: any;
let local: Record<string, string>;

beforeEach(() => {
  vi.resetModules();
  local = {};
  (globalThis as any).localStorage = {
    getItem: vi.fn((k: string) => local[k] || null),
    setItem: vi.fn((k: string, v: string) => { local[k] = v; }),
    removeItem: vi.fn((k: string) => { delete local[k]; }),
  };

  storageMock = {
    getTheme: vi.fn(async () => 'light'),
    setTheme: vi.fn(async () => {}),
    getPhoneSettings: vi.fn(() => ({
      bluetoothAddress: '',
      modemDevice: '',
      autoConnect: false,
      ringtone: '',
      vibrate: false,
    } as any)),
    setPhoneSettings: vi.fn(),
  };

  vi.doMock('../../services/storageService', () => ({ storageService: storageMock }));
});

describe('settingsCommandService', () => {
  it('toggles dark mode', async () => {
    const { settingsCommandService } = await import('../../services/settingsCommandService');
    const { memoryService } = await import('../../services/memoryService');
    const addSpy = vi.spyOn(memoryService, 'addMessage');

    const result = await settingsCommandService.execute('toggle dark mode');

    expect(result).toBe('Theme set to dark.');
    expect(storageMock.setTheme).toHaveBeenCalledWith('dark');
    expect(addSpy).toHaveBeenCalled();
  });

  it('enables auto-connect', async () => {
    const { settingsCommandService } = await import('../../services/settingsCommandService');
    const { memoryService } = await import('../../services/memoryService');
    const addSpy = vi.spyOn(memoryService, 'addMessage');

    const result = await settingsCommandService.execute('auto connect on');

    expect(result).toBe('Auto-connect enabled.');
    expect(storageMock.setPhoneSettings).toHaveBeenCalledWith(
      expect.objectContaining({ autoConnect: true })
    );
    expect(addSpy).toHaveBeenCalled();
  });
});
