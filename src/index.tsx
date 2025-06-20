import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import BootScreen from './components/BootScreen';
import { HashRouter } from 'react-router-dom';
import { StorageProvider } from './contexts/StorageProvider';
import { CloudSyncProvider } from './contexts/CloudSyncContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PhoneProvider } from './contexts/PhoneContext';
import { MemoryHubProvider } from './contexts/MemoryHubContext';
import { BrainPadProvider } from './contexts/BrainPadContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const bootInfo: any = (window as any).bootInfo || (window as any).boot_info;
const hasBootAnim = bootInfo && (bootInfo.svgBase || bootInfo.spriteBase);
const root = ReactDOM.createRoot(rootElement);

const renderApp = () => (
  <React.StrictMode>
    <HashRouter>
      <StorageProvider>
        <CloudSyncProvider>
          <ThemeProvider>
            <PhoneProvider>
              <MemoryHubProvider>
                <BrainPadProvider>
                  <App />
                </BrainPadProvider>
              </MemoryHubProvider>
            </PhoneProvider>
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
