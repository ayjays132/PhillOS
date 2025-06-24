import React, { createContext, useContext, useEffect, useState } from 'react';
import { storageService } from '../../services/storageService';
import { useTheme } from './ThemeContext';
import lightCursor from '../assets/cursors/arrow_light.svg?url';
import darkCursor from '../assets/cursors/arrow_dark.svg?url';

export type CursorStyle = 'default' | 'svg';

interface CursorContextProps {
  style: CursorStyle;
  setStyle: (style: CursorStyle) => void;
  animated: boolean;
  setAnimated: (v: boolean) => void;
}

const CursorContext = createContext<CursorContextProps | undefined>(undefined);

let initialStyle: CursorStyle = 'default';
try {
  const stored = localStorage.getItem('phillos_cursor_style');
  if (stored === 'default' || stored === 'svg') {
    initialStyle = stored;
  }
} catch {}

let initialAnimated = true;
try {
  const stored = localStorage.getItem('phillos_cursor_animated');
  if (stored === 'false') initialAnimated = false;
} catch {}

export const CursorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [style, setStyleState] = useState<CursorStyle>(initialStyle);
  const [animated, setAnimatedState] = useState<boolean>(initialAnimated);

  useEffect(() => {
    storageService.getCursorStyle().then(s => {
      if (s === 'default' || s === 'svg') {
        setStyleState(s);
      }
    });
  }, []);

  useEffect(() => {
    storageService.setCursorStyle(style);
  }, [style]);

  useEffect(() => {
    localStorage.setItem('phillos_cursor_animated', String(animated));
  }, [animated]);

  useEffect(() => {
    const url = theme === 'dark' ? darkCursor : lightCursor;
    const cursorValue = style === 'svg' ? `url(${url}) 0 0` : 'auto';
    document.documentElement.style.setProperty('--phillos-cursor', cursorValue);
  }, [style, theme]);

  const setStyle = (s: CursorStyle) => setStyleState(s);
  const setAnimated = (v: boolean) => setAnimatedState(v);

  return (
    <CursorContext.Provider value={{ style, setStyle, animated, setAnimated }}>
      {children}
    </CursorContext.Provider>
  );
};

export const useCursor = () => {
  const ctx = useContext(CursorContext);
  if (!ctx) throw new Error('useCursor must be used within CursorProvider');
  return ctx;
};
