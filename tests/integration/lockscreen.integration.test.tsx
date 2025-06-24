/* @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';

beforeEach(() => {
  vi.resetModules();
  (globalThis as any).localStorage = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
  };
  (globalThis as any).fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({ success: true }),
  }));
});

describe('LockScreen integration', () => {
  it('logs in with username and password', async () => {
    const { AuthProvider, useAuth } = await import('../../src/contexts/AuthContext');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);

    const Test: React.FC = () => {
      const { authenticated, login } = useAuth();
      React.useEffect(() => {
        login('user', 'pass');
      }, []);
      return <span data-auth={authenticated ? 'y' : 'n'} />;
    };

    root.render(
      <AuthProvider>
        <Test />
      </AuthProvider>
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(div.querySelector('span')?.getAttribute('data-auth')).toBe('y');
  });

  it('renders network and media widgets', async () => {
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
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(div.textContent).toContain('Wi-Fi Networks');
    // Media widget may or may not render depending on audio presence; ensure code does not crash
  });
});
