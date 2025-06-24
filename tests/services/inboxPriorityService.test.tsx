import { describe, it, expect, vi, beforeEach } from 'vitest';

let tagText: any;

vi.mock('../../services/modelManager', () => {
  tagText = vi.fn();
  return { tagText };
});

beforeEach(() => {
  vi.resetModules();
  tagText.mockResolvedValue(['important']);
});

describe('inboxPriorityService', () => {
  it('scores inbox messages and posts scores', async () => {
    const fetchMock = vi.fn(async url => {
      if (url === '/api/inboxai/messages') {
        return { ok: true, json: () => Promise.resolve({ messages: [{ id: 1, subject: 's', body: 'b' }] }) } as any;
      }
      return { ok: true, json: () => Promise.resolve({}) } as any;
    });
    vi.stubGlobal('fetch', fetchMock as any);
    const { inboxPriorityService } = await import('../../services/inboxPriorityService');
    await inboxPriorityService.scoreInbox();
    expect(tagText).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('/api/inboxai/score', expect.anything());
  });

  it('returns list from backend', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ messages: [{ id: 1, score: 1 }] })
    })) as any);
    const { inboxPriorityService } = await import('../../services/inboxPriorityService');
    const res = await inboxPriorityService.getPriorityList();
    expect(res).toEqual([{ id: 1, score: 1 }]);
  });
});
