/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

beforeEach(() => {
  vi.resetModules();
});

describe('GeneralSettingsView', () => {
  it('fetches and updates Do Not Disturb', async () => {
    const fetchDoNotDisturb = vi.fn(async () => true);
    const setDoNotDisturb = vi.fn();
    vi.mock('../../services/settingsService', () => ({
      settingsService: { fetchDoNotDisturb, setDoNotDisturb },
    }));
    vi.mock('../../services/systemSettingsService', () => ({
      systemSettingsService: {
        getTime: vi.fn(async () => ''),
        setTime: vi.fn(),
        getLocale: vi.fn(async () => ({ region: 'US', language: 'en' })),
        setLocale: vi.fn(),
      },
    }));

    const { GeneralSettingsView } = await import('../../src/apps/settings/GeneralSettingsView');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    root.render(React.createElement(GeneralSettingsView));
    await new Promise(r => setTimeout(r, 0));

    const checkbox = div.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(fetchDoNotDisturb).toHaveBeenCalled();
    expect(checkbox.checked).toBe(true);

    checkbox.click();
    await new Promise(r => setTimeout(r, 0));
    expect(setDoNotDisturb).toHaveBeenCalledWith(false);
  });
});
