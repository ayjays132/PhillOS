import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../services/patternAlertService.ts', () => ({
  patternAlertService: {
    loadProfile: vi.fn(async () => {}),
    train: vi.fn(),
    predict: vi.fn(),
    process: vi.fn(),
  },
}));
vi.mock('../../services/researchMate.ts', () => ({ researchMate: {} }));
vi.mock('better-sqlite3', () => ({
  default: vi.fn(() => ({
    pragma: vi.fn(),
    exec: vi.fn(),
    prepare: vi.fn(() => ({
      get: vi.fn(() => ({ c: 0 })),
      run: vi.fn(),
      all: vi.fn(() => []),
    })),
  })),
}));

beforeEach(() => {
  vi.resetModules();
  process.env.VITEST = '1';
  process.env.PHILLOS_STORAGE_DIR = '/tmp/test-storage';
});

describe('wifi and bluetooth security', () => {
  it('executes wifi connect via execFile', async () => {
    const execFile = vi.fn((cmd: string, args: string[], cb: (e: any) => void) => cb(null, ''));
    vi.doMock('child_process', () => ({ execFile, exec: vi.fn(), spawn: vi.fn() }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app)
      .post('/api/wifi/connect')
      .send({ ssid: 'HomeNet', password: 'mypassword' });
    expect(res.body).toEqual({ success: true });
    expect(execFile).toHaveBeenCalledWith(
      'nmcli',
      ['dev', 'wifi', 'connect', 'HomeNet', 'password', 'mypassword'],
      expect.any(Function)
    );
  });

  it('rejects malicious ssid', async () => {
    const execFile = vi.fn((cmd: string, args: string[], cb: (e: any) => void) => cb(null, ''));
    vi.doMock('child_process', () => ({ execFile, exec: vi.fn(), spawn: vi.fn() }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app)
      .post('/api/wifi/connect')
      .send({ ssid: 'bad;rm -rf /' });
    expect(res.status).toBe(400);
    expect(execFile).not.toHaveBeenCalled();
  });

  it('executes bluetooth pair via execFile', async () => {
    const execFile = vi.fn((cmd: string, args: string[], cb: (e: any) => void) => cb(null, ''));
    vi.doMock('child_process', () => ({ execFile, exec: vi.fn(), spawn: vi.fn() }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app)
      .post('/api/bluetooth/pair')
      .send({ mac: '00:11:22:33:44:55' });
    expect(res.body).toEqual({ success: true });
    expect(execFile).toHaveBeenCalledWith(
      'bluetoothctl',
      ['pair', '00:11:22:33:44:55'],
      expect.any(Function)
    );
  });

  it('rejects malicious mac', async () => {
    const execFile = vi.fn((cmd: string, args: string[], cb: (e: any) => void) => cb(null, ''));
    vi.doMock('child_process', () => ({ execFile, exec: vi.fn(), spawn: vi.fn() }));
    const { default: app } = await import('../../backend/server.js');
    const res = await request(app)
      .post('/api/bluetooth/pair')
      .send({ mac: 'bad$(rm)' });
    expect(res.status).toBe(400);
    expect(execFile).not.toHaveBeenCalled();
  });
});
