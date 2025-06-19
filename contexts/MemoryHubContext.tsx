import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { memoryHubService, MemoryWindow } from '../services/memoryHubService';

interface MemoryHubContextValue {
  windows: MemoryWindow[];
  addEntry: (content: string) => void;
  clear: () => void;
  setMaxSize: (size: number) => void;
}

const MemoryHubContext = createContext<MemoryHubContextValue | undefined>(undefined);

export const MemoryHubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<MemoryWindow[]>(() => memoryHubService.getWindows());

  useEffect(() => {
    memoryHubService.init();
    setWindows(memoryHubService.getWindows());
  }, []);

  const addEntry = useCallback((content: string) => {
    memoryHubService.addEntry(content);
    setWindows(memoryHubService.getWindows());
  }, []);

  const clear = useCallback(() => {
    memoryHubService.clear();
    setWindows(memoryHubService.getWindows());
  }, []);

  const setMaxSize = useCallback((size: number) => {
    memoryHubService.setMaxSize(size);
    setWindows(memoryHubService.getWindows());
  }, []);

  return (
    <MemoryHubContext.Provider value={{ windows, addEntry, clear, setMaxSize }}>
      {children}
    </MemoryHubContext.Provider>
  );
};

export const useMemoryHub = () => {
  const ctx = useContext(MemoryHubContext);
  if (!ctx) throw new Error('useMemoryHub must be used within MemoryHubProvider');
  return ctx;
};
