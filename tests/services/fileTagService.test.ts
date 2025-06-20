import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(() => Promise.resolve(['a', 'b']))
}));

describe('fileTagService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('calls smart_tags command', async () => {
    const { fileTagService } = await import('../../services/fileTagService');
    const tags = await fileTagService.tagFile('test.txt');
    expect(tags).toEqual(['a', 'b']);
  });

  it('returns empty array on error', async () => {
    const { invoke } = await import('@tauri-apps/api/tauri');
    (invoke as any).mockRejectedValue(new Error('fail'));
    const { fileTagService } = await import('../../services/fileTagService');
    const tags = await fileTagService.tagFile('x');
    expect(tags).toEqual([]);
  });
});
