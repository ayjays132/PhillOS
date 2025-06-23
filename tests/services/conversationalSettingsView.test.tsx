/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

beforeEach(() => {
  vi.resetModules();
});

describe('ConversationalSettingsView', () => {
  it('executes settings command and displays response', async () => {
    const execute = vi.fn(async () => 'Theme set to dark.');
    vi.mock('../../services/settingsCommandService', () => ({
      settingsCommandService: { execute }
    }));
    const { ConversationalSettingsView } = await import('../../src/apps/settings/ConversationalSettingsView');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    root.render(React.createElement(ConversationalSettingsView));
    await new Promise(r => setTimeout(r, 0));
    const input = div.querySelector('input') as HTMLInputElement;
    const button = div.querySelector('button') as HTMLButtonElement;
    input.value = 'toggle dark mode';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    button.click();
    await new Promise(r => setTimeout(r, 0));
    expect(execute).toHaveBeenCalledWith('toggle dark mode');
    expect(div.textContent).toContain('Theme set to dark.');
  });

  it('shows fallback for unknown command', async () => {
    const execute = vi.fn(async () => null);
    vi.mock('../../services/settingsCommandService', () => ({
      settingsCommandService: { execute }
    }));
    const { ConversationalSettingsView } = await import('../../src/apps/settings/ConversationalSettingsView');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    root.render(React.createElement(ConversationalSettingsView));
    await new Promise(r => setTimeout(r, 0));
    const input = div.querySelector('input') as HTMLInputElement;
    const button = div.querySelector('button') as HTMLButtonElement;
    input.value = 'blah blah';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    button.click();
    await new Promise(r => setTimeout(r, 0));
    expect(execute).toHaveBeenCalledWith('blah blah');
    expect(div.textContent).toContain("Sorry, I didn't understand that command.");
  });
});
