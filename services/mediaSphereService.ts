import type { Chapter as WasmChapter } from '../src/wasm/sceneDetector';
import { loadSceneDetector } from '../src/wasm/sceneDetector';

class MediaSphereService {
  private detectorPromise: Promise<(buf: ArrayBuffer) => Promise<WasmChapter[]>> | null = null;

  private async ensureDetector() {
    if (!this.detectorPromise) {
      this.detectorPromise = loadSceneDetector().catch(() => async () => []);
    }
    return this.detectorPromise;
  }
  async getMedia() {
    try {
      const res = await fetch('/api/mediasphere/media');
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    } catch {
      return [];
    }
  }

  async analyzeVideo(id: number) {
    try {
      const res = await fetch('/api/mediasphere/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return { result: '' };
      return await res.json();
    } catch {
      return { result: '' };
    }
  }

  async getChapters(id: number) {
    try {
      const res = await fetch('/api/mediasphere/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return { chapters: [], duration: 0 };
      return await res.json();
    } catch {
      return { chapters: [], duration: 0 };
    }
  }

  async detectChaptersWasm(file: File) {
    const detector = await this.ensureDetector();
    const buf = await file.arrayBuffer();
    return detector(buf);
  }

  async createRecap(id: number) {
    try {
      const res = await fetch('/api/mediasphere/recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return { result: '' };
      return await res.json();
    } catch {
      return { result: '' };
    }
  }

  async getEncodingAdvice(id: number) {
    try {
      const res = await fetch('/api/mediasphere/bitrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) return { bitrate: 0, recommended: '' };
      return await res.json();
    } catch {
      return { bitrate: 0, recommended: '' };
    }
  }
}

import { agentOrchestrator } from './agentOrchestrator';

export const mediaSphereService = new MediaSphereService();

agentOrchestrator.registerAction('mediasphere.analyze', params => mediaSphereService.analyzeVideo(Number(params?.id)));
agentOrchestrator.registerAction('mediasphere.get_media', () => mediaSphereService.getMedia());
agentOrchestrator.registerAction('mediasphere.get_chapters', params => mediaSphereService.getChapters(Number(params?.id)));
agentOrchestrator.registerAction('mediasphere.recap', params => mediaSphereService.createRecap(Number(params?.id)));
agentOrchestrator.registerAction('mediasphere.bitrate', params => mediaSphereService.getEncodingAdvice(Number(params?.id)));
