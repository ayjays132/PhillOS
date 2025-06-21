/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

const setup = async () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);
  const mod = await import('../../src/apps/appforge/AppForge');
  root.render(React.createElement(mod.AppForge));
  await new Promise(resolve => setTimeout(resolve, 0));
  return { div, root };
};

describe('AppForge UI', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('renders recommended apps', async () => {
    const recommendApps = vi.fn(() => ['one', 'two']);
    vi.mock('../../services/appForgeService', () => ({
      appForgeService: { build: vi.fn(), recommendApps },
    }));
    vi.mock('../../services/pulseService', () => ({
      pulseService: {
        onAlert: vi.fn(() => () => {}),
        subscribe: vi.fn(() => () => {}),
        getTrends: vi.fn(() => ({ cpu: 0, memory: 0 })),
      },
    }));

    const { div } = await setup();
    expect(recommendApps).toHaveBeenCalled();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(div.textContent).toContain('one');
    expect(div.textContent).toContain('two');
  });
});
