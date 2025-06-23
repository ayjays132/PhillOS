import { agentOrchestrator } from './agentOrchestrator';

// Simple numeric feature vector type
type Feature = number[];

// Load the WASM vision model if available, otherwise fall back to
// small recognition libraries for faces, fingerprints, and voice.
async function loadModel(): Promise<(src: string) => Promise<Feature>> {
  try {
    const mod = await import('../src/wasm/vision');
    return await mod.loadVisionModel();
  } catch {
    const faceapi = await import('@vladmandic/face-api');
    const meyda = await import('meyda');
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    return async (src: string): Promise<Feature> => {
      if (src.startsWith('data:audio') || src.endsWith('.wav')) {
        const arrayBuf = await (await fetch(src)).arrayBuffer();
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const buf = await ctx.decodeAudioData(arrayBuf);
        const features = meyda.extract('mfcc', buf.getChannelData(0));
        return Array.isArray(features) ? features : [];
      }
      const img = await faceapi.fetchImage(src);
      const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();
      return Array.from(detection?.descriptor || []);
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
  private fingerprints: Record<string, Feature[]> = {};
  private voices: Record<string, Feature[]> = {};
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

  async enrollFingerprint(userId: string, src: string) {
    const model = await this.ensureModel();
    const vec = await model(src);
    (this.fingerprints[userId] ||= []).push(vec);
  }

  async authenticateFingerprint(
    userId: string,
    src: string,
    threshold = -5
  ): Promise<boolean> {
    const entries = this.fingerprints[userId];
    if (!entries || entries.length === 0) return false;
    const model = await this.ensureModel();
    const vec = await model(src);
    for (const ref of entries) {
      if (similarity(ref, vec) >= threshold) return true;
    }
    return false;
  }

  async enrollVoice(userId: string, src: string) {
    const model = await this.ensureModel();
    const vec = await model(src);
    (this.voices[userId] ||= []).push(vec);
  }

  async authenticateVoice(
    userId: string,
    src: string,
    threshold = -5
  ): Promise<boolean> {
    const entries = this.voices[userId];
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

agentOrchestrator.registerAction('fingerprint.enroll', params =>
  faceAuthService.enrollFingerprint(String(params?.userId || ''), String(params?.image || ''))
);

agentOrchestrator.registerAction('fingerprint.authenticate', params =>
  faceAuthService.authenticateFingerprint(
    String(params?.userId || ''),
    String(params?.image || ''),
    Number(params?.threshold) || -5
  )
);

agentOrchestrator.registerAction('voice.enroll', params =>
  faceAuthService.enrollVoice(String(params?.userId || ''), String(params?.audio || ''))
);

agentOrchestrator.registerAction('voice.authenticate', params =>
  faceAuthService.authenticateVoice(
    String(params?.userId || ''),
    String(params?.audio || ''),
    Number(params?.threshold) || -5
  )
);

