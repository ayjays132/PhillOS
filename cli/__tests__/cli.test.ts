import { describe, it, expect, vi } from 'vitest';
import { PhillosCLI } from '../sdk';

vi.mock('../../android/controller.ts', () => ({
  startContainer: vi.fn(),
  stopContainer: vi.fn(),
  forwardDisplay: vi.fn(),
  forwardInput: vi.fn(),
  deployApk: vi.fn(),
  syncFile: vi.fn(),
}));

const fetchMock = vi.fn(async () => ({ json: async () => ({ ok: true }) } as any));

describe('PhillosCLI', () => {
  it('runs android start sequence', async () => {
    const { startContainer, forwardDisplay, forwardInput } = await import('../../android/controller.ts');
    const cli = new PhillosCLI();
    vi.stubGlobal('fetch', fetchMock);
    await cli.run(['node', 'phillos-cli', 'android', 'start']);
    expect(startContainer).toHaveBeenCalled();
    expect(forwardDisplay).toHaveBeenCalled();
    expect(forwardInput).toHaveBeenCalled();
  });

  it('sends phone sms', async () => {
    const cli = new PhillosCLI({ phoneBridgeUrl: 'http://test' });
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
    await cli.run(['node', 'phillos-cli', 'phone', 'sms', '123', 'hello']);
    expect(fetchMock).toHaveBeenCalled();
    const url = new URL((fetchMock.mock.calls[0] as any)[0]);
    expect(url.pathname).toBe('/sms');
  });

  it('rejects unsafe phone input', async () => {
    const cli = new PhillosCLI({ phoneBridgeUrl: 'http://test' });
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      cli.run(['node', 'phillos-cli', 'phone', 'sms', '123', 'evil;rm'])
    ).rejects.toThrow('Unsafe arguments');
  });

  it('rejects unsafe proton args', async () => {
    const cli = new PhillosCLI();
    await expect(
      cli.run(['node', 'phillos-cli', 'proton', 'launch', 'bad;rm'])
    ).rejects.toThrow('Unsafe arguments');
  });

  it('deploys apk via adb', async () => {
    const { deployApk } = await import('../../android/controller.ts');
    const cli = new PhillosCLI();
    await cli.run(['node', 'phillos-cli', 'android', 'deploy', 'app.apk']);
    expect(deployApk).toHaveBeenCalledWith('app.apk');
  });

  it('syncs file to device', async () => {
    const { syncFile } = await import('../../android/controller.ts');
    const cli = new PhillosCLI();
    await cli.run(['node', 'phillos-cli', 'android', 'sync', 'foo', 'bar']);
    expect(syncFile).toHaveBeenCalledWith('foo', 'bar', false);
  });
});
