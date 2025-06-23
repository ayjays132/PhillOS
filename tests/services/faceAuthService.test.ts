import { describe, it, expect, vi, beforeEach } from 'vitest';

const vectorize = vi.fn(async (src: string) => (src.includes('user') ? [1] : [0]));

vi.mock('../../src/wasm/vision', () => ({
  loadVisionModel: vi.fn(async () => vectorize)
}));

beforeEach(() => {
  vi.resetModules();
});

describe('faceAuthService', () => {
  it('enrolls and authenticates a face', async () => {
    const { faceAuthService } = await import('../../services/faceAuthService');
    await faceAuthService.enrollFace('u1', 'user-img');
    const ok = await faceAuthService.authenticateFace('u1', 'user-img');
    expect(ok).toBe(true);
  });

  it('rejects invalid face', async () => {
    const { faceAuthService } = await import('../../services/faceAuthService');
    await faceAuthService.enrollFace('u1', 'user-img');
    const ok = await faceAuthService.authenticateFace('u1', 'other-img');
    expect(ok).toBe(false);
  });
});

