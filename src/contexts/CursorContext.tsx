import React, { createContext, useContext, useEffect, useState } from 'react';
import { storageService } from '../../services/storageService';

export type CursorStyle = 'default' | 'mac';

interface CursorContextProps {
  style: CursorStyle;
  setStyle: (style: CursorStyle) => void;
}

const CursorContext = createContext<CursorContextProps | undefined>(undefined);

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [style, setStyleState] = useState<CursorStyle>('default');

  useEffect(() => {
    storageService.getCursorStyle().then(s => {
      if (s === 'default' || s === 'mac') {
        setStyleState(s);
      }
    });
  }, []);

  useEffect(() => {
    storageService.setCursorStyle(style);
  }, [style]);

  const setStyle = (s: CursorStyle) => setStyleState(s);

  return (
    <CursorContext.Provider value={{ style, setStyle }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  const ctx = useContext(CursorContext);
  if (!ctx) throw new Error('useCursor must be used within CursorProvider');
  return ctx;
};
