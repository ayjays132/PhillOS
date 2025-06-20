import React, { createContext, useContext, useEffect, useState } from 'react';
import { brainPadService, BrainPadEntry } from '../../services/brainPadService';

interface BrainPadCtxValue {
  entries: BrainPadEntry[];
  addEntry: (content: string) => void;
  clear: () => void;
}

const BrainPadContext = createContext<BrainPadCtxValue | undefined>(undefined);

export const BrainPadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entries, setEntries] = useState<BrainPadEntry[]>(() => brainPadService.getEntries());

  useEffect(() => {
    brainPadService.init();
    setEntries(brainPadService.getEntries());
  }, []);

  const addEntry = (content: string) => {
    brainPadService.addEntry(content);
    setEntries(brainPadService.getEntries());
  };

  const clear = () => {
    brainPadService.clear();
    setEntries(brainPadService.getEntries());
  };

  return (
    <BrainPadContext.Provider value={{ entries, addEntry, clear }}>
      {children}
    </BrainPadContext.Provider>
  );
};

export const useBrainPad = () => {
  const ctx = useContext(BrainPadContext);
  if (!ctx) throw new Error('useBrainPad must be used within BrainPadProvider');
  return ctx;
};
