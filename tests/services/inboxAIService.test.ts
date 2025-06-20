import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('inboxAIService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('getMessages fetches list', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id:1 }] })
    })) as any);
    const { inboxAIService } = await import('../../services/inboxAIService');
    const res = await inboxAIService.getMessages();
    expect(fetch).toHaveBeenCalledWith('/api/inboxai/messages');
    expect(res).toEqual([{ id:1 }]);
  });

  it('summarizeMessage posts id', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ summary: 'hi' })
    })) as any);
    const { inboxAIService } = await import('../../services/inboxAIService');
    const res = await inboxAIService.summarizeMessage(2);
    expect(fetch).toHaveBeenCalledWith('/api/inboxai/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 2 })
    });
    expect(res).toBe('hi');
  });
});
