import { describe, it, expect, vi, beforeEach } from 'vitest';

const images = ['img1.png', 'img2.png'];

vi.mock('../../src/wasm/vision', () => ({
  loadVisionModel: vi.fn(async () => async (src: string) => src.includes('1') ? [1,0] : [0,1])
}));

beforeEach(() => {
  vi.resetModules();
  (global as any).fetch = vi.fn(async (url: string) => {
    if (url.startsWith('/api/visionvault/images')) {
      return { ok: true, json: async () => ({ images }) } as any;
    }
    if (url.startsWith('/api/filetags')) {
      return { ok: true, json: async () => ({ tags: [] }) } as any;
    }
    return { ok: true, json: async () => ({}) } as any;
  });
});

describe('visionVaultService', () => {
  it('indexes images and finds the closest match', async () => {
    const { visionVaultService } = await import('../../services/visionVaultService');
    await visionVaultService.getImages();
    const res = await visionVaultService.search('img1.png');
    expect(res[0]).toBe('img1.png');
  });
});
