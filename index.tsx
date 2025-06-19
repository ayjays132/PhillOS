
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { StorageProvider } from './contexts/StorageProvider';
import { CloudSyncProvider } from './contexts/CloudSyncContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { PhoneProvider } from './contexts/PhoneContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <StorageProvider>
        <CloudSyncProvider>
          <ThemeProvider>
            <PhoneProvider>
              <App />
            </PhoneProvider>
          </ThemeProvider>
        </CloudSyncProvider>
      </StorageProvider>
    </HashRouter>
  </React.StrictMode>
);
