/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

beforeEach(() => {
  vi.resetModules();
  (globalThis as any).fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ notifications: [{ id: 1, text: 'Hello' }] }),
  }));
});

describe('LockScreenNotifications integration', () => {
  it('renders notifications from backend', async () => {
    const { AuthProvider } = await import('../../src/contexts/AuthContext');
    const { LockScreen } = await import('../../src/components/LockScreen');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    root.render(
      <AuthProvider>
        <LockScreen />
      </AuthProvider>
    );
    await new Promise(r => setTimeout(r, 0));
    expect(div.textContent).toContain('Hello');
  });
});
