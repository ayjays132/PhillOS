import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('patternAlertService', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns higher score for anomalies', async () => {
    const { initDb } = await import('../../backend/db.js');
    initDb();
    const { patternAlertService } = await import('../../services/patternAlertService');
    for (let i = 0; i < 10; i++) {
      patternAlertService.process({ bpm: 70, load: 0.2, memory: 0.3, threat: 0 });
    }
    const score = patternAlertService.process({ bpm: 120, load: 2, memory: 0.3, threat: 0 });
    expect(score).toBeGreaterThan(0.5);
  });
});
