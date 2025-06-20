import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

beforeEach(() => {
  vi.resetModules();
  process.env.VITEST = '1';
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
});
