import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn();

beforeEach(() => {
  vi.resetModules();
  invoke.mockReset();
});

describe('Vault frontend integration', () => {
  it('copies file via backend command', async () => {
    vi.doMock('@tauri-apps/api/tauri', () => ({ invoke }));
    const { vaultService } = await import('../../services/vaultService');
    await vaultService.copyFile('a.txt', 'b.txt');
    expect(invoke).toHaveBeenCalledWith('copy_file', { src: 'a.txt', dest: 'b.txt' });
  });
});
