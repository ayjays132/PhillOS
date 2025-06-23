import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

beforeEach(() => {
  vi.resetModules();
  process.env.VITEST = '1';
  process.env.PHILLOS_STORAGE_DIR = '/tmp/test-storage';
  delete process.env.API_TOKEN;
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

  it('trains and predicts anomaly score', async () => {
    const { default: app } = await import('../../backend/server.js');
    let res = await request(app)
      .post('/api/securecore/train')
      .send({ metrics: { bpm: 70, load: 0.1, memory: 0.2, threat: 0 } });
    expect(res.body).toEqual({ success: true });
    res = await request(app)
      .post('/api/securecore/predict')
      .send({ metrics: { bpm: 120, load: 1, memory: 0.2, threat: 0 } });
    expect(res.body.score).toBeGreaterThan(0);
  });

  it('blocks high risk executables', async () => {
    const fsMock = { readFileSync: vi.fn(() => '{}'), writeFileSync: vi.fn(), mkdirSync: vi.fn() };
    vi.doMock('fs', () => ({ default: fsMock }));
    vi.doMock('../../backend/sandboxShield.js', () => ({ scoreExecutable: () => 90, RISK_THRESHOLD: 70 }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app)
      .post('/api/launch-proton')
      .send({ path: '/tmp/test-storage/mal.exe' });
    expect(res.status).toBe(403);
  });

  it('rejects path outside storage', async () => {
    const { sanitizeUserPath } = await import('../../backend/server.js');
    expect(() => sanitizeUserPath('../etc/passwd')).toThrow();
  });

  it('rejects filetags outside storage', async () => {
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/api/filetags').query({ path: '../etc/passwd' });
    expect(res.status).toBe(400);
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
  vi.doMock('fs/promises', () => ({
    readFile: vi.fn(async () => JSON.stringify({ 'http://c': true }))
  }));
  const { default: app } = await import('../../backend/server.js');
  const res = await request(app).get('/api/weblens/summarize?url=http://x');
  expect(res.body.meta.title).toBe('Art');
  expect(res.body.meta.author).toBe('Bob');
  expect(res.body.citations.length).toBe(1);
  expect(res.body.citations[0].verified).toBe(true);
});

describe('token auth middleware', () => {
  it('rejects unauthorized proton launch', async () => {
    process.env.API_TOKEN = 'secret';
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).post('/api/launch-proton').send({ path: '/x' });
    expect(res.status).toBe(401);
  });

  it('rejects unauthorized phone bridge access', async () => {
    process.env.API_TOKEN = 'secret';
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/phonebridge/test');
    expect(res.status).toBe(401);
  });
});

describe('new system endpoints', () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.VITEST = '1';
    process.env.PHILLOS_STORAGE_DIR = '/tmp/test-storage';
  });

  it('reads and writes locale', async () => {
    const fsMock = {
      readFileSync: vi.fn(() => '{"region":"US","language":"en"}'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
    };
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    let res = await request(app).get('/api/locale');
    expect(res.body.locale.region).toBe('US');
    res = await request(app).post('/api/locale').send({ locale: { region: 'FR', language: 'fr' } });
    expect(res.body).toEqual({ success: true });
    expect(fsMock.writeFileSync).toHaveBeenCalled();
  });

  it('returns storage usage', async () => {
    const fsMock = {
      readdirSync: vi.fn(() => ['dir']),
      statSync: vi.fn(() => ({ isDirectory: () => true, size: 0 })),
    } as any;
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/api/storage/usage');
    expect(res.body.usage).toBeDefined();
  });

  it('returns diagnostics info', async () => {
    vi.doMock('os', () => ({
      default: { loadavg: () => [0.5], freemem: () => 50, totalmem: () => 100, uptime: () => 42 }
    }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/api/diagnostics');
    expect(res.body.cpu).toBe(0.5);
    expect(res.body.memory).toBeCloseTo(0.5);
    expect(res.body.uptime).toBe(42);
  });

  it('exports and imports settings', async () => {
    const fsMock = {
      readFileSync: vi.fn(() => '{"a":1}'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn()
    };
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    let res = await request(app).get('/api/settings');
    expect(res.body.settings.a).toBe(1);
    res = await request(app).post('/api/settings').send({ settings: { b: 2 } });
    expect(res.body).toEqual({ success: true });
    expect(fsMock.writeFileSync).toHaveBeenCalled();
  });

  it('returns storage stats', async () => {
    const fsMock = {
      readdirSync: vi.fn(() => ['dir']),
      statSync: vi.fn(() => ({ isDirectory: () => true, size: 0 })),
      statfsSync: vi.fn(() => ({ bsize: 100, blocks: 1000, bavail: 500 })),
    } as any;
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/api/storage/stats');
    expect(res.body.stats.total).toBe(100000);
    expect(res.body.stats.free).toBe(50000);
  });

  it('returns battery info', async () => {
    const fsMock = {
      readFileSync: vi.fn((p: string) => (p.includes('capacity') ? '50' : 'Charging')),
      statfsSync: vi.fn(() => ({ bsize: 100, blocks: 1000, bavail: 500 })),
      readdirSync: vi.fn(() => []),
      statSync: vi.fn(),
    } as any;
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/api/power/battery');
    expect(res.body.battery.level).toBeCloseTo(0.5);
    expect(res.body.battery.charging).toBe(true);
  });

  it('reads and writes power profile', async () => {
    const fsMock = {
      readFileSync: vi.fn(() => 'performance'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      statfsSync: vi.fn(() => ({ bsize: 100, blocks: 1000, bavail: 500 })),
      readdirSync: vi.fn(() => []),
      statSync: vi.fn(),
    } as any;
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    let res = await request(app).get('/api/power/profile');
    expect(res.body.profile).toBe('performance');
    res = await request(app).post('/api/power/profile').send({ profile: 'balanced' });
    expect(res.body).toEqual({ success: true });
    expect(fsMock.writeFileSync).toHaveBeenCalled();
  });

  it('returns network stats', async () => {
    const fsMock = {
      readFileSync: vi.fn((p: string) => {
        if (p.includes('rx_bytes')) return '100';
        if (p.includes('tx_bytes')) return '200';
        return '0';
      }),
      readdirSync: vi.fn((p: string) => (p === '/sys/class/net' ? ['eth0'] : [])),
      statSync: vi.fn(() => ({ isDirectory: () => true, size: 0 })),
      statfsSync: vi.fn(() => ({ bsize: 100, blocks: 1000, bavail: 500 })),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
    } as any;
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/api/network/stats');
    expect(res.body.stats[0].rx).toBe(100);
    expect(res.body.stats[0].tx).toBe(200);
  });

  it('reads and writes tethering state', async () => {
    const fsMock = {
      readFileSync: vi.fn(() => '1'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
      readdirSync: vi.fn(() => []),
      statSync: vi.fn(() => ({ isDirectory: () => true, size: 0 })),
      statfsSync: vi.fn(() => ({ bsize: 100, blocks: 1000, bavail: 500 })),
    } as any;
    vi.doMock('fs', () => ({ default: fsMock }));
    const { default: app } = await import('../../backend/server.js');
    let res = await request(app).get('/api/network/tethering');
    expect(res.body.tethering).toBe(true);
    res = await request(app).post('/api/network/tethering').send({ tethering: false });
    expect(res.body).toEqual({ success: true });
    expect(fsMock.writeFileSync).toHaveBeenCalled();
  });
});
