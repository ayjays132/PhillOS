import React, { createContext, useContext, useEffect, useState } from 'react';
import { visionVaultService } from '../../services/visionVaultService';
import { faceAuthService } from '../../services/faceAuthService';

interface AuthContextProps {
  authenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
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
    if (username && password) {
      persist(true);
      return true;
    }
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
