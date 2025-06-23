/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

beforeEach(() => {
  vi.resetModules();
});

describe('SettingsLayout', () => {
  it('executes command on Enter key press', async () => {
    const execute = vi.fn(async () => 'Theme set to dark.');
    const navigate = vi.fn();
    vi.mock('../../services/settingsCommandService', () => ({
      settingsCommandService: { execute },
    }));
    vi.mock('react-router-dom', () => ({
      NavLink: (p: any) => <a data-nav={p.to}>{p.children}</a>,
      Outlet: () => <div />,
      Routes: (p: any) => <div>{p.children}</div>,
      Route: () => <div />,
      useNavigate: () => navigate,
    }));
    const mod = await import('../../src/apps/settings/SettingsLayout');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    root.render(React.createElement(mod.SettingsLayout));
    await new Promise(r => setTimeout(r, 0));
    const input = div.querySelector('input') as HTMLInputElement;
    input.value = 'toggle dark mode';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await new Promise(r => setTimeout(r, 0));
    expect(execute).toHaveBeenCalledWith('toggle dark mode');
    expect(navigate).toHaveBeenCalled();
  });

  it('filters categories based on input', async () => {
    vi.mock('../../services/settingsCommandService', () => ({
      settingsCommandService: { execute: vi.fn(async () => null) },
    }));
    vi.mock('react-router-dom', () => ({
      NavLink: (p: any) => <a data-nav={p.to}>{p.children}</a>,
      Outlet: () => <div />,
      Routes: (p: any) => <div>{p.children}</div>,
      Route: () => <div />,
      useNavigate: () => vi.fn(),
    }));
    const mod = await import('../../src/apps/settings/SettingsLayout');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    root.render(React.createElement(mod.SettingsLayout));
    await new Promise(r => setTimeout(r, 0));
    const input = div.querySelector('input') as HTMLInputElement;
    input.value = 'network';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(r => setTimeout(r, 0));
    const links = div.querySelectorAll('a[data-nav]');
    expect(links.length).toBe(1);
    expect(links[0].getAttribute('data-nav')).toContain('network');
  });
});
