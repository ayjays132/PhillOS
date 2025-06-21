import React, { createContext, useContext, useEffect, useState } from 'react';
import { cursorService } from '../services/cursorService';
import lightCursor from '../assets/cursors/arrow_light.svg?url';
import darkCursor from '../assets/cursors/arrow_dark.svg?url';

export type CursorTheme = 'light' | 'dark';

interface CursorContextProps {
  cursor: CursorTheme;
  setCursor: (theme: CursorTheme) => void;
}

const CursorContext = createContext<CursorContextProps | undefined>(undefined);

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cursor, setCursorState] = useState<CursorTheme>('light');

  useEffect(() => {
    cursorService.getCursor().then(c => {
      if (c === 'light' || c === 'dark') {
        setCursorState(c);
      }
    });
  }, []);

  useEffect(() => {
    const url = cursor === 'light' ? lightCursor : darkCursor;
    document.documentElement.style.setProperty('--phillos-cursor', `url(${url}) 0 0`);
    cursorService.setCursor(cursor);
  }, [cursor]);

  const setCursor = (t: CursorTheme) => setCursorState(t);

  return (
    <CursorContext.Provider value={{ cursor, setCursor }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  const ctx = useContext(CursorContext);
  if (!ctx) throw new Error('useCursor must be used within CursorProvider');
  return ctx;
};
