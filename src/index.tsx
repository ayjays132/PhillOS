import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import BootScreen from './components/BootScreen';
import { HashRouter } from 'react-router-dom';
import lightCursor from './assets/cursors/arrow_light.svg?url';
import darkCursor from './assets/cursors/arrow_dark.svg?url';
import { StorageProvider } from './contexts/StorageProvider';
import { CloudSyncProvider } from './contexts/CloudSyncContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CursorProvider } from './contexts/CursorContext';
import Cursor from './components/Cursor';
import { PhoneProvider } from './contexts/PhoneContext';
import { AuthProvider } from './contexts/AuthContext';
import { MemoryHubProvider } from './contexts/MemoryHubContext';
import { BrainPadProvider } from './contexts/BrainPadContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

let initialCursorStyle: 'default' | 'svg' = 'default';
try {
  const stored = localStorage.getItem('phillos_cursor_style');
  if (stored === 'default' || stored === 'svg') {
    initialCursorStyle = stored;
  }
} catch {}

let initialThemeDark = true;
try {
  const storedTheme = localStorage.getItem('phillos-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') {
    initialThemeDark = storedTheme === 'dark';
  } else if (typeof (window as any).bootInfo?.themeDark === 'number') {
    initialThemeDark = !!(window as any).bootInfo.themeDark;
  } else if (typeof (window as any).boot_info?.theme_dark === 'number') {
    initialThemeDark = !!(window as any).boot_info.theme_dark;
  }
} catch {}

const cursorUrl =
  initialCursorStyle === 'svg'
    ? (initialThemeDark ? darkCursor : lightCursor)
    : initialThemeDark
      ? darkCursor
      : lightCursor;

document.documentElement.style.setProperty('--phillos-cursor', `url(${cursorUrl}) 0 0`);

const bootInfo: any = (window as any).bootInfo || (window as any).boot_info;
const hasBootAnim = bootInfo && (bootInfo.svgBase || bootInfo.spriteBase);
const root = ReactDOM.createRoot(rootElement);

const renderApp = () => (
  <React.StrictMode>
    <HashRouter>
      <StorageProvider>
        <CloudSyncProvider>
          <ThemeProvider>
            <CursorProvider>
              <PhoneProvider>
                <MemoryHubProvider>
                  <BrainPadProvider>
                    <AuthProvider>
                      <App />
                      <Cursor />
                    </AuthProvider>
                  </BrainPadProvider>
                </MemoryHubProvider>
              </PhoneProvider>
            </CursorProvider>
          </ThemeProvider>
        </CloudSyncProvider>
      </StorageProvider>
    </HashRouter>
  </React.StrictMode>
);

if (hasBootAnim) {
  root.render(<BootScreen />);
  setTimeout(() => root.render(renderApp()), 3000);
} else {
  root.render(renderApp());
}
