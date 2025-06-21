import React, { createContext, useContext, useEffect, useState } from 'react';
import { storageService } from '../../services/storageService';
import { useTheme } from './ThemeContext';
import lightCursor from '../assets/cursors/arrow_light.svg?url';
import darkCursor from '../assets/cursors/arrow_dark.svg?url';
import macCursor from '../assets/cursors/mac.svg?url';

export type CursorStyle = 'default' | 'mac';

interface CursorContextProps {
  style: CursorStyle;
  setStyle: (style: CursorStyle) => void;
}

const CursorContext = createContext<CursorContextProps | undefined>(undefined);

let initialStyle: CursorStyle = 'default';
try {
  const stored = localStorage.getItem('phillos_cursor_style');
  if (stored === 'default' || stored === 'mac') {
    initialStyle = stored;
  }
} catch {}

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [style, setStyleState] = useState<CursorStyle>(initialStyle);

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

  useEffect(() => {
    const url = style === 'mac' ? macCursor : theme === 'dark' ? darkCursor : lightCursor;
    document.documentElement.style.setProperty('--phillos-cursor', `url(${url}) 0 0`);
  }, [style, theme]);

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
