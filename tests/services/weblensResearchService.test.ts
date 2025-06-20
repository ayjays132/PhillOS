import { describe, it, expect, vi, beforeEach } from 'vitest';

let summarize: any;

vi.mock('../../services/modelManager', () => {
  summarize = vi.fn();
  return { summarize };
});

beforeEach(() => {
  vi.resetModules();
  summarize.mockResolvedValue('Fact one.\nFact two.');
});

describe('weblensResearchService', () => {
  it('factCheck returns parsed results', async () => {
    const { weblensResearchService } = await import('../../services/weblensResearchService');
    const res = await weblensResearchService.factCheck('text');
    expect(summarize).toHaveBeenCalledWith('text');
    expect(res).toEqual([
      { text: 'Fact one', source: 'source1', confidence: 0.5 },
      { text: 'Fact two', source: 'source2', confidence: 0.5 },
    ]);
  });
});
