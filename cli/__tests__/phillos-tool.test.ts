import { describe, it, expect, vi } from 'vitest';
import { PhillosTool } from '../phillos';

vi.mock('child_process', () => ({
  spawn: vi.fn(() => ({
    on: (event: string, cb: (code?: number) => void) => {
      if (event === 'exit') cb(0);
    }
  }))
}));

vi.mock('../../backend/protonLauncher.ts', () => ({
  createProtonLauncher: vi.fn(() => ({
    launch: vi.fn()
  }))
}));

vi.mock('../../services/agentService.ts', () => ({
  agentService: {
    start: vi.fn(),
    stop: vi.fn(),
  }
}));

describe('PhillosTool', () => {
  it('rejects build without root', async () => {
    const tool = new PhillosTool();
    vi.spyOn(process, 'getuid').mockReturnValue(1000 as any);
    await expect(tool.run(['node', 'phillos', 'build'])).rejects.toThrow('root');
  });

  it('starts agent service', async () => {
    const { agentService } = await import('../../services/agentService.ts');
    const tool = new PhillosTool();
    vi.spyOn(process, 'getuid').mockReturnValue(0 as any);
    await tool.run(['node', 'phillos', 'agent', 'start']);
    expect(agentService.start).toHaveBeenCalled();
  });
});
