import { describe, it, expect, vi, beforeEach } from 'vitest';

const spawnMock = vi.fn(() => ({
  on: (event: string, cb: (code?: number) => void) => {
    if (event === 'exit') cb(0);
  },
}));

vi.mock('child_process', () => ({
  spawn: spawnMock,
}));

beforeEach(() => {
  spawnMock.mockClear();
});

describe('android controller', () => {
  it('starts container', async () => {
    const { startContainer } = await import('../../android/controller.ts');
    await startContainer();
    expect(spawnMock).toHaveBeenCalledWith('waydroid', ['container', 'start'], { stdio: 'inherit' });
    expect(spawnMock).toHaveBeenCalledWith('waydroid', ['session', 'start'], { stdio: 'inherit' });
  });

  it('stops container', async () => {
    const { stopContainer } = await import('../../android/controller.ts');
    await stopContainer();
    expect(spawnMock).toHaveBeenCalledWith('waydroid', ['session', 'stop'], { stdio: 'inherit' });
    expect(spawnMock).toHaveBeenCalledWith('waydroid', ['container', 'stop'], { stdio: 'inherit' });
  });

  it('forwards display', async () => {
    const { forwardDisplay } = await import('../../android/controller.ts');
    await forwardDisplay();
    expect(spawnMock).toHaveBeenCalledWith('waydroid', ['show-full-ui'], { stdio: 'inherit' });
  });

  it('deploys apk', async () => {
    const { deployApk } = await import('../../android/controller.ts');
    await deployApk('app.apk');
    expect(spawnMock).toHaveBeenCalledWith('adb', ['install', '-r', 'app.apk'], { stdio: 'inherit' });
  });

  it('syncs file push and pull', async () => {
    const { syncFile } = await import('../../android/controller.ts');
    await syncFile('src', 'dest');
    expect(spawnMock).toHaveBeenCalledWith('adb', ['push', 'src', 'dest'], { stdio: 'inherit' });
    spawnMock.mockClear();
    await syncFile('src', 'dest', true);
    expect(spawnMock).toHaveBeenCalledWith('adb', ['pull', 'src', 'dest'], { stdio: 'inherit' });
  });
});
