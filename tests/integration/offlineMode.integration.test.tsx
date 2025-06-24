import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import request from 'supertest';

let dir: string;

beforeEach(() => {
  vi.resetModules();
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'phillos-offline-'));
  fs.writeFileSync(path.join(dir, 'offline.cfg'), '1');
  process.env.PHILLOS_STORAGE_DIR = dir;
  process.env.VITEST = '1';
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('backend offline mode', () => {
  it('rejects web requests when offline', async () => {
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/api/weblens/summarize?url=http://x');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'offline' });
  });

  it('rejects mediasphere actions when offline', async () => {
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app)
      .post('/api/mediasphere/analyze')
      .send({ id: 1 });
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'offline' });
  });
});
