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

  it('summary worker emits bullets', async () => {
    const { createSummaryWorker } = await import('../../services/modelManager');
    const bullets: string[][] = [];
    const worker = createSummaryWorker(b => bullets.push(b), 0);
    worker.update('hello world');
    await new Promise(r => setTimeout(r, 0));
    expect(bullets[0][0]).toMatch(/^• /);
    worker.stop();
  });
});
