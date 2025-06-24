import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  (globalThis as any).localStorage = {
    getItem: vi.fn(() => '[]'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
});

describe('storageService applySettingChange', () => {
  it('reverts developer mode', async () => {
    const { storageService } = await import('../../services/storageService');
    storageService.applySettingChange({
      path: 'developer.devMode',
      oldValue: true,
      newValue: false,
      timestamp: Date.now(),
    });
    expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith(
      'phillos_dev_mode',
      'true'
    );
  });

  it('reverts telemetry flag', async () => {
    const { storageService } = await import('../../services/storageService');
    storageService.applySettingChange({
      path: 'system.telemetry',
      oldValue: false,
      newValue: true,
      timestamp: Date.now(),
    });
    expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith(
      'phillos_telemetry',
      'false'
    );
  });
});
