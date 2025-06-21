import { agentOrchestrator } from './agentOrchestrator';

type Feature = number[];

async function loadModel(): Promise<(src: string) => Promise<Feature>> {
  try {
    const mod = await import('../src/wasm/vision');
    return await mod.loadVisionModel();
  } catch {
    // Fallback dummy model if WASM build is missing
    return async (src: string): Promise<Feature> => {
      let hash = 0;
      for (let i = 0; i < src.length; i++) {
        hash = (hash * 31 + src.charCodeAt(i)) >>> 0;
      }
      return [hash & 0xff, (hash >> 8) & 0xff, (hash >> 16) & 0xff, (hash >> 24) & 0xff];
    };
  }
}

function similarity(a: Feature, b: Feature): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const d = a[i] - b[i];
    sum -= d * d;
  }
  return sum;
}

class VisionVaultService {
  private images: string[] = [];
  private index: { src: string; vec: Feature }[] = [];
  private arMemories: { name: string; lat: number; lon: number }[] = [];
  private modelPromise: Promise<(src: string) => Promise<Feature>> | null = null;
  private xrSession: XRSession | null = null;

  private async ensureModel() {
    if (!this.modelPromise) this.modelPromise = loadModel();
    return this.modelPromise;
  }

  private async buildIndex() {
    try {
      const res = await fetch('/api/visionvault/index');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.index)) {
          this.index = data.index;
          return;
        }
      }
    } catch {
      // ignore and build dynamically
    }
    if (!this.images.length) return;
    const model = await this.ensureModel();
    this.index = await Promise.all(
      this.images.map(async src => ({ src, vec: await model(src) }))
    );
  }

  async getImages() {
    if (this.images.length) return this.images;
    try {
      const res = await fetch('/api/visionvault/images');
      if (!res.ok) return [];
      const data = await res.json();
      this.images = data.images || [];
      await this.buildIndex();
      this.loadARMemories().catch(() => {});
      return this.images;
    } catch {
      return [];
    }
  }

  private async loadARMemories() {
    if (this.arMemories.length) return this.arMemories;
    try {
      const res = await fetch('/api/visionvault/ar_memories');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.memories)) this.arMemories = data.memories;
      }
    } catch {
      // ignore
    }
    return this.arMemories;
  }

  async getARMemories() {
    await this.loadARMemories();
    return this.arMemories;
  }

  async search(query: string, limit = 5): Promise<string[]> {
    if (!this.index.length) await this.getImages();
    if (!this.index.length) return [];
    const model = await this.ensureModel();
    const qvec = await model(query);
    const results = this.index
      .map(e => ({ src: e.src, score: similarity(e.vec, qvec) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    return results.map(r => r.src);
  }

  async enhance(src: string, filter = 'auto'): Promise<string> {
    try {
      const res = await fetch('/api/visionvault/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ src, filter }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.src || src;
      }
    } catch {
      // ignore
    }
    return src;
  }

  async startAR() {
    if (this.xrSession || !('xr' in navigator)) return;
    try {
      const session = await (navigator as any).xr.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
      });
      this.xrSession = session;
      const overlay = document.createElement('div');
      overlay.id = 'ar-overlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '10px';
      overlay.style.left = '10px';
      overlay.style.color = 'yellow';
      overlay.style.zIndex = '10000';
      overlay.textContent = 'AR active';
      document.body.appendChild(overlay);
      session.addEventListener('end', () => overlay.remove());
    } catch {
      this.xrSession = null;
    }
  }

  stopAR() {
    if (this.xrSession) {
      this.xrSession.end();
      this.xrSession = null;
    }
  }
}

export const visionVaultService = new VisionVaultService();

agentOrchestrator.registerAction('visionvault.get_images', () => visionVaultService.getImages());
agentOrchestrator.registerAction('visionvault.search', params =>
  visionVaultService.search(String(params?.query || ''), Number(params?.limit) || 5)
);
agentOrchestrator.registerAction('vision.ar_memories', () => visionVaultService.getARMemories());
