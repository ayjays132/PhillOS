import { agentOrchestrator } from './agentOrchestrator';
import { soundScapeService } from './soundScapeService';

async function loadAnalyzer(): Promise<(data: string | ArrayBuffer) => Promise<string>> {
  try {
    const mod = await import('../src/wasm/audioAnalyzer');
    const loader = await mod.loadAudioAnalyzer();
    return async (data: string | ArrayBuffer) => {
      const res = await loader(data);
      return res.mood;
    };
  } catch {
    return async (_data: string | ArrayBuffer) => 'unknown';
  }
}

interface Track {
  id: number;
  title: string;
  artist: string;
}

class MoodMixService {
  private analyzerPromise: Promise<(d: string | ArrayBuffer) => Promise<string>> | null = null;

  private async ensure() {
    if (!this.analyzerPromise) this.analyzerPromise = loadAnalyzer();
    return this.analyzerPromise;
  }

  async categorizeTracks(): Promise<(Track & { mood: string })[]> {
    const tracks = await soundScapeService.getTracks();
    const analyze = await this.ensure();
    const results: (Track & { mood: string })[] = [];
    for (const t of tracks) {
      const mood = await analyze(t.title);
      results.push({ ...t, mood });
    }
    return results;
  }
}

export const moodMixService = new MoodMixService();

agentOrchestrator.registerAction('moodmix.categorize', () => moodMixService.categorizeTracks());
