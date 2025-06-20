class MediaSphereService {
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
}

import { agentOrchestrator } from './agentOrchestrator';

export const mediaSphereService = new MediaSphereService();

agentOrchestrator.registerAction('mediasphere.analyze', params => mediaSphereService.analyzeVideo(Number(params?.id)));
agentOrchestrator.registerAction('mediasphere.get_media', () => mediaSphereService.getMedia());
agentOrchestrator.registerAction('mediasphere.get_chapters', params => mediaSphereService.getChapters(Number(params?.id)));
