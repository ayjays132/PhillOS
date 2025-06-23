import React, { createContext, useContext, useEffect, useState } from 'react';
import { visionVaultService } from '../../services/visionVaultService';
import { faceAuthService } from '../../services/faceAuthService';
import { offlineService } from '../../services/offlineService';

const PIN_HASH_KEY = 'phillos_pin_hash';

async function hashPin(pin: string): Promise<string> {
  const buf = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

interface AuthContextProps {
  authenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  pinLogin: (pin: string) => Promise<boolean>;
  faceLogin: () => Promise<boolean>;
  fingerprintLogin: () => Promise<boolean>;
  voiceLogin: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('phillos_auth');
      if (stored === '1') setAuthenticated(true);
    } catch {}
  }, []);

  const persist = (val: boolean) => {
    setAuthenticated(val);
    try {
      localStorage.setItem('phillos_auth', val ? '1' : '0');
    } catch {}
  };

  const login = async (username: string, password: string) => {
    if (offlineService.isOffline()) {
      persist(true);
      return true;
    }
    if (!username || !password) return false;
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        persist(true);
        return true;
      }
    } catch {}
    persist(false);
    return false;
  };

  const pinLogin = async (pin: string) => {
    if (!pin) return false;
    const hashed = await hashPin(pin);
    const stored = localStorage.getItem(PIN_HASH_KEY);
    if (stored && stored === hashed) {
      persist(true);
      return true;
    }
    if (offlineService.isOffline()) return false;
    try {
      const res = await fetch('/api/pinlogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(PIN_HASH_KEY, hashed);
        persist(true);
        return true;
      }
    } catch {}
    return false;
  };

  const faceLogin = async () => {
    try {
      if (navigator.credentials && (navigator.credentials as any).get) {
        await (navigator.credentials as any).get({ publicKey: { challenge: new Uint8Array([0]) } });
        persist(true);
        return true;
      }
    } catch {}
    try {
      await visionVaultService.search('self', 1);
      persist(true);
      return true;
    } catch {}
    return false;
  };

  const fingerprintLogin = async () => {
    try {
      await faceAuthService.authenticateFingerprint('self', 'scan');
      persist(true);
      return true;
    } catch {}
    return false;
  };

  const voiceLogin = async () => {
    try {
      await faceAuthService.authenticateVoice('self', 'audio');
      persist(true);
      return true;
    } catch {}
    return false;
  };

  const logout = () => persist(false);

  return (
    <AuthContext.Provider
      value={{
        authenticated,
        login,
        pinLogin,
        faceLogin,
        fingerprintLogin,
        voiceLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
