/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

beforeEach(() => {
  vi.resetModules();
  (globalThis as any).localStorage = {
    getItem: vi.fn(() => 'dark'),
    setItem: vi.fn(),
  };
  (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ cursor: 'dark' }) }));
});

describe('CursorContext', () => {
  it('initializes from localStorage and sets CSS variable', async () => {
    const { CursorProvider } = await import('../../src/contexts/CursorContext');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    await new Promise<void>(resolve => {
      root.render(
        <CursorProvider>
          <span>test</span>
        </CursorProvider>
      );
      // allow effects to run
      setTimeout(resolve, 0);
    });
    expect(document.documentElement.style.getPropertyValue('--phillos-cursor')).not.toBe('');
  });
});
