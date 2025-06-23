/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

beforeEach(() => {
  vi.resetModules();
  (globalThis as any).sessionStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  };
});

describe('LockScreenMedia integration', () => {
  it('shows playing media and hides when dismissed', async () => {
    vi.mock('../../services/mediaSphereService', () => ({
      mediaSphereService: { getMedia: vi.fn(async () => [{ id: 1, title: 'Video' }]) },
    }));
    vi.mock('../../services/soundScapeService', () => ({
      soundScapeService: { getTracks: vi.fn(async () => []) },
    }));
    const { LockScreenMedia } = await import('../../src/components/LockScreenMedia');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    root.render(React.createElement(LockScreenMedia));
    await new Promise(r => setTimeout(r, 0));
    expect(div.textContent).toContain('Video');
    const btns = div.querySelectorAll('button');
    (btns[2] as HTMLButtonElement).click();
    await new Promise(r => setTimeout(r, 0));
    expect((globalThis as any).sessionStorage.setItem).toHaveBeenCalledWith('lockscreen_media_hidden', '1');
    expect(div.textContent).not.toContain('Now Playing');
  });
});
