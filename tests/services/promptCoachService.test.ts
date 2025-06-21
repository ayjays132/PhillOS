import { describe, it, expect, vi, beforeEach } from 'vitest';

let createSession: any;
let sendStream: any;

vi.mock('../../services/cloudAIService', () => {
  createSession = vi.fn();
  sendStream = vi.fn();
  return { createCloudChatSession: createSession, sendMessageStream: sendStream };
});

beforeEach(() => {
  vi.resetModules();
  createSession.mockResolvedValue({});
  sendStream.mockImplementation(async function* () {
    yield '- tip one\n';
    yield '* tip two';
  });
});

describe('promptCoachService', () => {
  it('returns parsed tips', async () => {
    const { promptCoachService } = await import('../../services/promptCoachService');
    const tips = await promptCoachService.getTips('test', 'key');
    expect(createSession).toHaveBeenCalled();
    expect(tips).toEqual(['tip one', 'tip two']);
  });

  it('handles failure gracefully', async () => {
    createSession.mockResolvedValue(null);
    const { promptCoachService } = await import('../../services/promptCoachService');
    const tips = await promptCoachService.getTips('bad');
    expect(tips).toEqual([]);
  });
});
