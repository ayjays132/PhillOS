/* @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

const setup = async () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  const root = createRoot(div);
  const mod = await import('../../src/apps/soundscape/SoundScape');
  root.render(React.createElement(mod.SoundScape));
  await new Promise(resolve => setTimeout(resolve, 0));
  return { div, root, mod };
};

describe('SoundScape UI', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('subscribes to live insights and displays metrics', async () => {
    const subscribe = vi.fn();
    vi.mock('../../services/liveInsightsService', () => ({
      liveInsightsService: { subscribe },
    }));
    vi.mock('../../services/soundScapeService', () => ({
      soundScapeService: { getTracks: vi.fn(async () => []) },
    }));
    vi.mock('../../services/moodMixService', () => ({
      moodMixService: { categorizeTracks: vi.fn(async () => []) },
    }));
    vi.mock('../../services/soundAnalyzer', () => ({
      soundAnalyzer: { getNoiseLevel: vi.fn(async () => 0) },
      calculateEqForNoise: () => ({ low: 0, mid: 0, high: 0 }),
    }));

    const { div } = await setup();
    expect(subscribe).toHaveBeenCalled();
    const handler = subscribe.mock.calls[0][0];
    handler({ energy: 0.5, tempo: 120 });
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(div.textContent).toContain('Tempo: 120');
    expect(div.textContent).toContain('Energy: 0.5');
  });

  it('fetches mood mix on button click', async () => {
    const subscribe = vi.fn();
    const categorizeTracks = vi.fn(async () => [
      { id: 1, title: 'a', artist: 'b', mood: 'happy' },
    ]);
    vi.mock('../../services/liveInsightsService', () => ({
      liveInsightsService: { subscribe },
    }));
    vi.mock('../../services/soundScapeService', () => ({
      soundScapeService: { getTracks: vi.fn(async () => []) },
    }));
    vi.mock('../../services/moodMixService', () => ({
      moodMixService: { categorizeTracks },
    }));
    vi.mock('../../services/soundAnalyzer', () => ({
      soundAnalyzer: { getNoiseLevel: vi.fn(async () => 0) },
      calculateEqForNoise: () => ({ low: 0, mid: 0, high: 0 }),
    }));

    const { div } = await setup();
    const btn = div.querySelector('button') as HTMLButtonElement;
    btn.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(categorizeTracks).toHaveBeenCalled();
    expect(div.textContent).toContain('happy');
    expect(div.textContent).toContain('a - b');
  });
});
