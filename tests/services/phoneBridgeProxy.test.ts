import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

beforeEach(() => {
  vi.resetModules();
  process.env.VITEST = '1';
  process.env.PHONE_BRIDGE_URL = 'http://127.0.0.1:65535';
  process.env.PHONE_BRIDGE_TIMEOUT = '10';
});

describe('phone bridge proxy', () => {
  it('returns json error when bridge is unreachable', async () => {
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app).get('/phonebridge/status');
    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: 'phone bridge unreachable' });
  });
});
