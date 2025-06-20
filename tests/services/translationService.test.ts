import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/wasm/translator', () => ({
  loadTranslator: vi.fn(async () => async (text: string, opts: any) => `${text}:${opts.tgt_lang}`)
}));

beforeEach(() => {
  vi.resetModules();
});

describe('translationService', () => {
  it('translates text using wasm model', async () => {
    const { translationService } = await import('../../services/translationService');
    const res = await translationService.translate('hello', 'es');
    expect(res).toBe('hello:es');
  });
});
