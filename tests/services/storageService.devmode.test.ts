import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  (globalThis as any).localStorage = {
    getItem: vi.fn(() => 'true'),
    setItem: vi.fn(),
  };
});

describe('storageService dev mode', () => {
  it('retrieves dev mode from localStorage', async () => {
    const { storageService } = await import('../../services/storageService');
    const state = storageService.getDevMode();
    expect(state).toBe(true);
  });

  it('stores dev mode', async () => {
    const { storageService } = await import('../../services/storageService');
    storageService.setDevMode(false);
    expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith('phillos_dev_mode', 'false');
  });
});

describe('storageService telemetry', () => {
  it('retrieves telemetry flag from localStorage', async () => {
    const { storageService } = await import('../../services/storageService');
    const state = storageService.getTelemetry();
    expect(state).toBe(true);
  });

  it('stores telemetry flag', async () => {
    const { storageService } = await import('../../services/storageService');
    storageService.setTelemetry(false);
    expect((globalThis as any).localStorage.setItem).toHaveBeenCalledWith('phillos_telemetry', 'false');
  });
});
