import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PhillosCLI } from '../sdk';
import path from 'path';

const spawnMock = vi.fn(() => ({
  on: (event: string, cb: (code?: number) => void) => {
    if (event === 'exit') cb(0);
  }
}));

vi.mock('child_process', () => ({
  spawn: spawnMock,
}));

beforeEach(() => {
  spawnMock.mockClear();
});

describe('kernel query command', () => {
  it('spawns query tool', async () => {
    const cli = new PhillosCLI();
    await cli.run(['node', 'phillos-cli', 'kernel', 'query', 'heap']);
    expect(spawnMock).toHaveBeenCalled();
    const [cmd, args] = spawnMock.mock.calls[0];
    expect(path.basename(cmd as string)).toBe('query_tool');
    expect(args).toEqual(['heap']);
  });
});
