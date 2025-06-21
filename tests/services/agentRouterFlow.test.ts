import { describe, it, expect, vi, beforeEach } from 'vitest';

const processCommand = vi.fn();
const tagFile = vi.fn(async () => ['tagA', 'tagB']);
const sendMessage = vi.fn(async () => true);

vi.mock('../../services/agentService', () => ({ agentService: { processCommand } }));
vi.mock('../../services/fileTagService', () => ({ fileTagService: { tagFile } }));
vi.mock('../../services/inboxAIService', () => ({ inboxAIService: { sendMessage } }));

beforeEach(() => {
  vi.resetModules();
  processCommand.mockReset();
  tagFile.mockClear();
  sendMessage.mockClear();
});

describe('agentRouter flow', () => {
  it('tags a file then emails the tags', async () => {
    processCommand
      .mockResolvedValueOnce({ action: 'vault.smartTags', parameters: { path: 'doc.txt' } })
      .mockResolvedValueOnce({ action: 'inbox.send', parameters: { body: 'tagA, tagB' } });

    const { agentOrchestrator } = await import('../../services/agentOrchestrator');
    await import('../../services/agentRouter');

    await agentOrchestrator.processIntent('tag it');

    expect(tagFile).toHaveBeenCalledWith('doc.txt');

    await Promise.resolve();
    expect(sendMessage).toHaveBeenCalledWith('tagA, tagB');
  });
});
