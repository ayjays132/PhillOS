import React, { createContext, useContext } from 'react';
import { usePhoneBridge } from '../hooks/usePhoneBridge';

const PhoneContext = createContext<ReturnType<typeof usePhoneBridge> | undefined>(undefined);

export const PhoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const phone = usePhoneBridge();
  return <PhoneContext.Provider value={phone}>{children}</PhoneContext.Provider>;
};

export const usePhone = () => {
  const ctx = useContext(PhoneContext);
  if (!ctx) throw new Error('usePhone must be used within PhoneProvider');
  return ctx;
};
