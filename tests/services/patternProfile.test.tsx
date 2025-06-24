import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

let tmpDir: string;

beforeEach(() => {
  vi.resetModules();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phillos-test-'));
  process.env.PHILLOS_STORAGE_DIR = tmpDir;
});

describe('patternAlertService model', () => {
  it('trains and persists profile', async () => {
    const { initDb } = await import('../../backend/db.js');
    initDb();
    const { patternAlertService } = await import('../../services/patternAlertService');
    await patternAlertService.loadProfile();
    for (let i = 0; i < 10; i++) {
      await patternAlertService.train({ bpm: 70, load: 0.2, memory: 0.3, threat: 0 });
    }
    const normal = patternAlertService.predict({ bpm: 70, load: 0.2, memory: 0.3, threat: 0 });
    expect(normal).toBeLessThan(0.1);

    vi.resetModules();
    process.env.PHILLOS_STORAGE_DIR = tmpDir;
    const { initDb: initDb2 } = await import('../../backend/db.js');
    initDb2();
    const { patternAlertService: service2 } = await import('../../services/patternAlertService');
    await service2.loadProfile();
    const normal2 = service2.predict({ bpm: 70, load: 0.2, memory: 0.3, threat: 0 });
    const anomaly = service2.predict({ bpm: 120, load: 2, memory: 0.3, threat: 0 });
    expect(normal2).toBeLessThan(0.1);
    expect(anomaly).toBeGreaterThan(0.5);
  });
});
