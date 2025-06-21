import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

beforeEach(() => {
  vi.resetModules();
  process.env.VITEST = '1';
  process.env.PHILLOS_STORAGE_DIR = '/tmp/test-storage';
});

describe('backend server theme API', () => {
  it('returns theme from file', async () => {
    const fsMock = {
      readFileSync: vi.fn(() => 'light'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
    };
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/api/theme');
    expect(res.body).toEqual({ theme: 'light' });
  });

  it('saves theme to file', async () => {
    const writeFileSync = vi.fn();
    const fsMock = {
      readFileSync: vi.fn(() => 'dark'),
      writeFileSync,
      mkdirSync: vi.fn(),
    };
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).post('/api/theme').send({ theme: 'light' });
    expect(res.body).toEqual({ success: true });
    expect(writeFileSync).toHaveBeenCalled();
  });

  it('rejects malicious theme filename', async () => {
    process.env.PHILLOS_STORAGE_DIR = '/tmp';
    const fsMock = {
      readFileSync: vi.fn(() => 'dark'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
    };
    vi.doMock('fs', () => ({ default: fsMock }));
    const mod = await import('../../backend/server.js');
    expect(() => mod.sanitizeStoragePath('../bad.cfg')).toThrow();
  });

  it('rejects malicious exe path', async () => {
    const fsMock = {
      readFileSync: vi.fn(() => '{}'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
    };
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app)
      .post('/api/launch-proton')
      .send({ path: 'bad\0.exe' });
    expect(res.status).toBe(400);
  });

  it('returns current threat score', async () => {
    const { default: app, setThreatScore } = await import('../../backend/server.js');
    setThreatScore(55);
    const res = await request(app).get('/api/securecore/threat');
    expect(res.body).toEqual({ score: 55 });
  });

  it('returns predicted threat score', async () => {
    const { default: app, setThreatPredictScore } = await import('../../backend/server.js');
    setThreatPredictScore(66);
    const res = await request(app).get('/api/securecore/threatpredict');
    expect(res.body).toEqual({ score: 66 });
  });

  it('blocks high risk executables', async () => {
    const fsMock = { readFileSync: vi.fn(() => '{}'), writeFileSync: vi.fn(), mkdirSync: vi.fn() };
    vi.doMock('fs', () => ({ default: fsMock }));
    vi.doMock('../../backend/sandboxShield.js', () => ({ scoreExecutable: () => 90, RISK_THRESHOLD: 70 }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).post('/api/launch-proton').send({ path: '/mal.exe' });
    expect(res.status).toBe(403);
  });
});

it('returns article metadata and citations', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => ({
    text: async () => '<title>Art</title><meta name="author" content="Bob"><meta property="article:published_time" content="2023"><a href="http://c">ref</a>'
  })) as any);
  const { default: app } = await import('../../backend/server.js');
  const res = await request(app).get('/api/weblens/summarize?url=http://x');
  expect(res.body.meta.title).toBe('Art');
  expect(res.body.meta.author).toBe('Bob');
  expect(res.body.citations.length).toBe(1);
});
