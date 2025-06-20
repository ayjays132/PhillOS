import { describe, it, expect, vi } from 'vitest';

vi.mock('@xenova/transformers', () => ({
  pipeline: vi.fn(async (task: string) => {
    return async (text: string, opts?: any) => {
      if (task === 'summarization') {
        return [{ summary_text: 'sum' }];
      }
      return { labels: ['x', 'y', 'z'] };
    };
  })
}));

describe('modelManager wasm models', () => {
  it('summarizes text', async () => {
    const { summarize } = await import('../../services/modelManager');
    const s = await summarize('hello');
    expect(s).toBe('sum');
  });

  it('tags text', async () => {
    const { tagText } = await import('../../services/modelManager');
    const tags = await tagText('hello', ['a','b']);
    expect(tags).toEqual(['x','y','z'].slice(0,3));
  });
});
