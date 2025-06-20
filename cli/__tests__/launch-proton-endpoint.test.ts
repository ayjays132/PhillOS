import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import http from 'http';

const launcherMock = vi.fn(() => ({ launch: vi.fn(() => Promise.resolve()) }));
vi.mock('../../backend/protonLauncher.js', () => ({
  createProtonLauncher: launcherMock,
}));

vi.mock('fs', async () => {
  return {
    default: {
      readFileSync: vi.fn(() => '{}'),
      writeFileSync: vi.fn(),
      mkdirSync: vi.fn(),
    },
  };
});

let server: http.Server;
let url: string;

async function start() {
  const mod = await import('../../backend/server.js');
  const app = mod.default;
  server = app.listen(0);
  const address = server.address() as any;
  url = `http://localhost:${address.port}`;
}

function stop() {
  return new Promise<void>(resolve => server.close(() => resolve()));
}

describe('POST /api/launch-proton', () => {
  beforeEach(async () => {
    launcherMock.mockClear();
    await start();
  });

  afterEach(async () => {
    await stop();
  });

  it('requires path parameter', async () => {
    const res = await fetch(`${url}/api/launch-proton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('path required');
  });

  it('launches executable via proton', async () => {
    const launch = vi.fn();
    launcherMock.mockReturnValueOnce({ launch });
    const res = await fetch(`${url}/api/launch-proton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/foo.exe', version: 'p8' }),
    });
    expect(res.status).toBe(200);
    expect(launcherMock).toHaveBeenCalledWith({ version: 'p8', prefix: undefined, wineBinary: undefined });
    expect(launch).toHaveBeenCalledWith('/foo.exe');
  });

  it('handles launcher errors', async () => {
    launcherMock.mockReturnValueOnce({ launch: vi.fn(() => Promise.reject(new Error('bad'))) });
    const res = await fetch(`${url}/api/launch-proton`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: '/foo.exe' }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('bad');
  });
});
