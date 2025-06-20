import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/wasm/citation', () => ({
  loadCitationVerifier: vi.fn(async () => async (text: string) => text.length % 2 === 0),
}));

beforeEach(() => {
  vi.resetModules();
});

describe('researchMate', () => {
  it('verifies citations using wasm', async () => {
    const { researchMate } = await import('../../services/researchMate');
    const res = await researchMate.verifyCitations([
      { text: 'a', url: 'u' },
      { text: 'bb', url: 'u' },
    ]);
    expect(res).toEqual([false, true]);
  });
});
