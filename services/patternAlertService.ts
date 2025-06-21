import { SystemMetrics } from './modelManager';

class PatternAlertService {
  private history: SystemMetrics[] = [];
  private maxHistory = 60;

  process(m: SystemMetrics): number {
    this.history.push(m);
    if (this.history.length > this.maxHistory) this.history.shift();
    if (this.history.length < 5) return 0;
    const keys: (keyof SystemMetrics)[] = ['bpm', 'load', 'memory', 'threat'];
    const scores = keys.map(k => this.zScore(k, m[k]));
    const max = Math.max(...scores.map(s => Math.abs(s)));
    // scale to 0..1 using typical 3-sigma range
    return Math.min(1, max / 3);
  }

  private zScore(key: keyof SystemMetrics, value: number): number {
    const vals = this.history.map(h => h[key]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = Math.sqrt(vals.reduce((a, b) => a + (b - avg) ** 2, 0) / vals.length) || 1;
    return (value - avg) / sd;
  }
}

export const patternAlertService = new PatternAlertService();
