import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs/promises', () => ({
  readFile: vi.fn(async () => JSON.stringify({ u: true })),
}));

beforeEach(() => {
  vi.resetModules();
});

describe('researchMate', () => {
  it('verifies citations using knowledge base', async () => {
    const { researchMate } = await import('../../services/researchMate');
    const res = await researchMate.verifyCitations([
      { text: 'a', url: 'u' },
      { text: 'b', url: 'x' },
    ]);
    expect(res).toEqual([true, false]);
  });
});
