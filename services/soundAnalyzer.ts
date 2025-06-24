export interface EQSettings {
  low: number;
  mid: number;
  high: number;
}

export function calculateEqForNoise(level: number): EQSettings {
  // Very naive heuristic for demo purposes
  if (level > 0.05) {
    return { low: -2, mid: 1, high: 2 };
  }
  return { low: 0, mid: 0, high: 0 };
}

export class SoundAnalyzer {
  async getNoiseLevel(duration = 500): Promise<number> {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const data = new Float32Array(analyser.fftSize);
    const interval = 100;
    const iterations = Math.max(1, Math.floor(duration / interval));
    let sum = 0;

    for (let i = 0; i < iterations; i++) {
      await new Promise(r => setTimeout(r, interval));
      analyser.getFloatTimeDomainData(data);
      let rms = 0;
      for (let j = 0; j < data.length; j++) {
        rms += data[j] * data[j];
      }
      rms = Math.sqrt(rms / data.length);
      sum += rms;
    }

    stream.getTracks().forEach(t => t.stop());
    await ctx.close();

    return sum / iterations;
  }
}

export const soundAnalyzer = new SoundAnalyzer();

import { agentOrchestrator } from './agentOrchestrator';

agentOrchestrator.registerAction('sound.noise_level', params => soundAnalyzer.getNoiseLevel(Number(params?.duration || 500)));
