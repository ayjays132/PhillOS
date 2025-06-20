import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(() => Promise.resolve([
    { id: 1, title: 'Meeting', start: '2024-01-01T09:00:00Z', end: '2024-01-01T10:00:00Z' }
  ]))
}));

describe('noteLinkService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('matches notes to events by date', async () => {
    const { noteLinkService } = await import('../../services/noteLinkService');
    const ts = Date.parse('2024-01-01T08:00:00Z');
    const links = await noteLinkService.linkNotes([{ content: 'prep', timestamp: ts }]);
    expect(Object.keys(links).length).toBe(1);
    expect(links[ts][0].title).toBe('Meeting');
  });
});
