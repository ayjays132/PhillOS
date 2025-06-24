import { SystemMetrics } from './modelManager';
import { getProfile, saveProfile } from '../backend/db.js';

type MetricKey = 'bpm' | 'load' | 'memory' | 'threat';

interface Profile {
  count: number;
  mean: Record<MetricKey, number>;
  variance: Record<MetricKey, number>;
}

class PatternAlertService {
  private profile: Profile = {
    count: 0,
    mean: { bpm: 0, load: 0, memory: 0, threat: 0 },
    variance: { bpm: 0, load: 0, memory: 0, threat: 0 },
  };

  async loadProfile() {
    const data = await getProfile('pattern_profile');
    if (data) this.profile = data as Profile;
  }

  private async persist() {
    await saveProfile('pattern_profile', this.profile);
  }

  train(m: SystemMetrics) {
    const keys: MetricKey[] = ['bpm', 'load', 'memory', 'threat'];
    const p = this.profile;
    const n = p.count + 1;
    keys.forEach(k => {
      const delta = m[k] - p.mean[k];
      p.mean[k] += delta / n;
      p.variance[k] += delta * (m[k] - p.mean[k]);
    });
    p.count = n;
    this.persist().catch(() => {});
  }

  predict(m: SystemMetrics): number {
    if (this.profile.count < 5) return 0;
    const keys: MetricKey[] = ['bpm', 'load', 'memory', 'threat'];
    const scores = keys.map(k => {
      const mean = this.profile.mean[k];
      const variance = this.profile.variance[k] / this.profile.count;
      const sd = Math.sqrt(variance) || 1;
      return (m[k] - mean) / sd;
    });
    const max = Math.max(...scores.map(s => Math.abs(s)));
    return Math.min(1, max / 3);
  }

  process(m: SystemMetrics): number {
    this.train(m);
    return this.predict(m);
  }
}

export const patternAlertService = new PatternAlertService();

import { agentOrchestrator } from './agentOrchestrator';

agentOrchestrator.registerAction('pattern.process', params => patternAlertService.process(params as SystemMetrics));
