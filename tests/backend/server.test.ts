import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

beforeEach(() => {
  vi.resetModules();
  process.env.VITEST = '1';
  process.env.PHILLOS_STORAGE_DIR = '/tmp/test-storage';
  process.env.PHILLOS_APP_DIR = '/tmp/app';
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

  it('rejects exe paths outside app dir', async () => {
    const fsMock = { readFileSync: vi.fn(() => '{}'), writeFileSync: vi.fn(), mkdirSync: vi.fn() };
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app)
      .post('/api/launch-proton')
      .send({ path: '/other/outside.exe' });
    expect(res.status).toBe(400);
  });

  it('sanitizeUserPath rejects escaping paths', async () => {
    const mod = await import('../../backend/server.js');
    expect(() => mod.sanitizeUserPath('/outside/file.exe')).toThrow();
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
    const res = await request(app)
      .post('/api/launch-proton')
      .send({ path: '/tmp/app/mal.exe' });
    expect(res.status).toBe(403);
  });
});

describe('backend server cursor API', () => {
  it('returns cursor from file', async () => {
    const fsMock = {
      readFileSync: vi.fn(() => 'light'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
    };
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/api/cursor');
    expect(res.body).toEqual({ cursor: 'light' });
  });

  it('saves cursor to file', async () => {
    const writeFileSync = vi.fn();
    const fsMock = {
      readFileSync: vi.fn(() => 'dark'),
      writeFileSync,
      mkdirSync: vi.fn(),
    };
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).post('/api/cursor').send({ cursor: 'light' });
    expect(res.body).toEqual({ success: true });
    expect(writeFileSync).toHaveBeenCalled();
  });
});

describe('backend server ai config API', () => {
  it('saves and returns config', async () => {
    const { default: app } = await import('../../backend/server.js');
    const config = { localModel: 'm', cloudProvider: 'gemini', summarizerModel: 's', classifierModel: 'c' };
    const res1 = await request(app).post('/api/aiconfig').send({ config });
    expect(res1.body).toEqual({ success: true });
    const res2 = await request(app).get('/api/aiconfig');
    expect(res2.body).toEqual({ config });
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
