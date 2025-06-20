import { describe, it, expect, vi, beforeEach } from 'vitest';

class MockSpeechRecognition {
  public onresult: ((e: any) => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  emit(e: any) { this.onresult && this.onresult(e); }
}

let mockRec: MockSpeechRecognition;

beforeEach(() => {
  vi.resetModules();
  mockRec = new MockSpeechRecognition();
  (global as any).window = {
    SpeechRecognition: vi.fn(() => mockRec),
    speechSynthesis: { speak: vi.fn() },
  };
  (global as any).localStorage = { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn() };
});

describe('VoiceService (web)', () => {
  it('starts recognition and forwards transcripts', async () => {
    const { VoiceService } = await import('../../services/voiceService');
    const service = new VoiceService('web');
    const cb = vi.fn();

    service.start(cb);
    expect(mockRec.start).toHaveBeenCalled();

    mockRec.emit({
      resultIndex: 0,
      results: [
        { 0: { transcript: 'hello ' }, length: 1, isFinal: false },
        { 0: { transcript: 'world' }, length: 1, isFinal: true },
      ],
    } as any);

    expect(cb).toHaveBeenNthCalledWith(1, 'hello', false);
    expect(cb).toHaveBeenNthCalledWith(2, 'hello world', true);
  });

  it('stops recognition', async () => {
    const { VoiceService } = await import('../../services/voiceService');
    const service = new VoiceService('web');
    service.start(() => {});
    service.stop();
    expect(mockRec.stop).toHaveBeenCalled();
  });
});
