import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

let spawnMock: any;
let httpsGetMock: any;

vi.mock('child_process', () => ({
  spawn: (...args: any[]) => {
    spawnMock(...args);
    return { on: (e: string, cb: (c?: number) => void) => { if (e === 'exit') cb(0); } };
  }
}));

vi.mock('https', () => ({ get: (...args: any[]) => httpsGetMock(...args) }));

beforeEach(() => {
  vi.resetModules();
  spawnMock = vi.fn();
  httpsGetMock = vi.fn(() => ({ on: vi.fn() }));
  delete process.env.PROTON_DOWNLOAD_URL;
  delete process.env.PHILLOS_CACHE_DIR;
});

describe('downloadProton', () => {
  it('uses cached archive when present', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proton-'));
    const cache = path.join(dir, 'cache');
    const base = path.join(dir, 'out');
    fs.mkdirSync(cache);
    const archive = path.join(cache, 'Proton-8.0.tar.gz');
    fs.writeFileSync(archive, '');
    process.env.PHILLOS_CACHE_DIR = cache;

    const { downloadProton } = await import('../../backend/protonLauncher.ts');
    await downloadProton(base, 'Proton-8.0');

    expect(httpsGetMock).not.toHaveBeenCalled();
    expect(spawnMock).toHaveBeenCalledWith('tar', ['-xf', archive, '-C', base]);
  });

  it('copies archive from file url', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'proton-'));
    const cache = path.join(dir, 'cache');
    const base = path.join(dir, 'out');
    fs.mkdirSync(cache);
    const src = path.join(dir, 'src.tar.gz');
    fs.writeFileSync(src, 'dummy');
    process.env.PHILLOS_CACHE_DIR = cache;
    process.env.PROTON_DOWNLOAD_URL = `file://${src}`;

    const { downloadProton } = await import('../../backend/protonLauncher.ts');
    await downloadProton(base, 'Proton-9.0');

    const dest = path.join(cache, 'Proton-9.0.tar.gz');
    expect(fs.existsSync(dest)).toBe(true);
    expect(httpsGetMock).not.toHaveBeenCalled();
  });
});
