import React, { createContext, useContext, useState, useEffect } from 'react';
import { useCloudSync } from '../hooks/useCloudSync';

interface CloudSyncContextProps {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

const CloudSyncContext = createContext<CloudSyncContextProps | undefined>(undefined);
const STORAGE_KEY = 'phillos_cloud_sync_enabled';

export const CloudSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enabled, setEnabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, [enabled]);

  useCloudSync(enabled);

  return (
    <CloudSyncContext.Provider value={{ enabled, setEnabled }}>
      {children}
    </CloudSyncContext.Provider>
  );
};

export const useCloudSyncSetting = () => {
  const ctx = useContext(CloudSyncContext);
  if (!ctx) throw new Error('useCloudSyncSetting must be used within CloudSyncProvider');
  return ctx;
};
