import { agentOrchestrator } from './agentOrchestrator';

// Simple numeric feature vector type
type Feature = number[];

// Load the WASM vision model if available, otherwise fall back to a hash based placeholder
async function loadModel(): Promise<(src: string) => Promise<Feature>> {
  try {
    const mod = await import('../src/wasm/vision');
    return await mod.loadVisionModel();
  } catch {
    return async (src: string): Promise<Feature> => {
      let hash = 0;
      for (let i = 0; i < src.length; i++) {
        hash = (hash * 31 + src.charCodeAt(i)) >>> 0;
      }
      return [hash & 0xff, (hash >> 8) & 0xff, (hash >> 16) & 0xff, (hash >> 24) & 0xff];
    };
  }
}

// similarity metric used for face vectors
function similarity(a: Feature, b: Feature): number {
  const len = Math.min(a.length, b.length);
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const d = a[i] - b[i];
    sum -= d * d;
  }
  return sum;
}

class FaceAuthService {
  private faces: Record<string, Feature[]> = {};
  private modelPromise: Promise<(src: string) => Promise<Feature>> | null = null;

  private async ensureModel() {
    if (!this.modelPromise) this.modelPromise = loadModel();
    return this.modelPromise;
  }

  async enrollFace(userId: string, src: string) {
    const model = await this.ensureModel();
    const vec = await model(src);
    (this.faces[userId] ||= []).push(vec);
  }

  async authenticateFace(userId: string, src: string, threshold = -5): Promise<boolean> {
    const entries = this.faces[userId];
    if (!entries || entries.length === 0) return false;
    const model = await this.ensureModel();
    const vec = await model(src);
    for (const ref of entries) {
      if (similarity(ref, vec) >= threshold) return true;
    }
    return false;
  }
}

export const faceAuthService = new FaceAuthService();

agentOrchestrator.registerAction('faceauth.enroll', params =>
  faceAuthService.enrollFace(String(params?.userId || ''), String(params?.image || ''))
);

agentOrchestrator.registerAction('faceauth.authenticate', params =>
  faceAuthService.authenticateFace(
    String(params?.userId || ''),
    String(params?.image || ''),
    Number(params?.threshold) || -5
  )
);

