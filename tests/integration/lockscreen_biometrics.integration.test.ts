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
});

describe('LockScreen biometrics and offline login', () => {
  it('logs in with fingerprint', async () => {
    vi.mock('../../services/faceAuthService', () => ({
      faceAuthService: { authenticateFingerprint: vi.fn(async () => true) },
    }));
    const { AuthProvider, useAuth } = await import('../../src/contexts/AuthContext');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    const Test: React.FC = () => {
      const { authenticated, fingerprintLogin } = useAuth();
      React.useEffect(() => {
        fingerprintLogin();
      }, []);
      return <span data-auth={authenticated ? 'y' : 'n'} />;
    };
    root.render(
      <AuthProvider>
        <Test />
      </AuthProvider>
    );
    await new Promise(r => setTimeout(r, 0));
    expect(div.querySelector('span')?.getAttribute('data-auth')).toBe('y');
  });

  it('logs in with voice', async () => {
    vi.mock('../../services/faceAuthService', () => ({
      faceAuthService: { authenticateVoice: vi.fn(async () => true) },
    }));
    const { AuthProvider, useAuth } = await import('../../src/contexts/AuthContext');
    const div = document.createElement('div');
    document.body.appendChild(div);
    const root = createRoot(div);
    const Test: React.FC = () => {
      const { authenticated, voiceLogin } = useAuth();
      React.useEffect(() => {
        voiceLogin();
      }, []);
      return <span data-auth={authenticated ? 'y' : 'n'} />;
    };
    root.render(
      <AuthProvider>
        <Test />
      </AuthProvider>
    );
    await new Promise(r => setTimeout(r, 0));
    expect(div.querySelector('span')?.getAttribute('data-auth')).toBe('y');
  });

  it('logs in when offline without network calls', async () => {
    vi.mock('../../services/offlineService', () => ({
      offlineService: {
        isOffline: () => true,
        subscribe: (h: any) => { h(true); return () => {}; },
      },
    }));
    (globalThis as any).fetch = vi.fn();
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
    await new Promise(r => setTimeout(r, 0));
    expect((globalThis as any).fetch).not.toHaveBeenCalled();
    expect(div.querySelector('span')?.getAttribute('data-auth')).toBe('y');
  });

  it('mounts network and media widgets', async () => {
    vi.mock('../../services/offlineService', () => ({
      offlineService: {
        isOffline: () => true,
        subscribe: (h: any) => { h(true); return () => {}; },
      },
    }));
    vi.mock('../../services/mediaSphereService', () => ({
      mediaSphereService: { getMedia: vi.fn(async () => []) },
    }));
    vi.mock('../../services/soundScapeService', () => ({
      soundScapeService: { getTracks: vi.fn(async () => []) },
    }));
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
    expect(div.textContent).toContain('Wi-Fi');
  });
});
