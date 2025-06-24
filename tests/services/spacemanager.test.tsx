import { describe, it, expect, vi, beforeEach } from 'vitest';

let storage: Record<string, string>;

beforeEach(() => {
  vi.resetModules();
  storage = {};
  (globalThis as any).localStorage = {
    getItem: vi.fn((k: string) => storage[k] || null),
    setItem: vi.fn((k: string, v: string) => { storage[k] = v; }),
    removeItem: vi.fn((k: string) => { delete storage[k]; }),
  };
  (globalThis as any).window = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as any;
});

describe('workspaceSnapService groups', () => {
  it('extracts groups from layout', async () => {
    const { workspaceSnapService } = await import('../../services/workspaceSnapService');
    const layout = [
      { id: 'a', x: 0, y: 0, width: 1, height: 1, group: 0 },
      { id: 'b', x: 10, y: 0, width: 1, height: 1, group: 1 },
    ];
    await workspaceSnapService.save('test', layout);
    expect(workspaceSnapService.getGroups('test')).toEqual([0, 1]);
  });

  it('switches groups using gestureService', async () => {
    const { workspaceSnapService } = await import('../../services/workspaceSnapService');
    const { gestureService } = await import('../../services/gestureService');
    const layout = [
      { id: 'a', x: 0, y: 0, width: 1, height: 1, group: 0 },
      { id: 'b', x: 10, y: 0, width: 1, height: 1, group: 1 },
    ];
    await workspaceSnapService.save('default', layout);
    gestureService.init(['0', '1']);
    const cb = vi.fn();
    gestureService.onSwitch(id => {
      const win = workspaceSnapService.switchGroup('default', Number(id));
      cb(win?.map(w => w.id));
    });
    gestureService.next();
    expect(cb).toHaveBeenCalledWith(['b']);
  });
});
