
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { HashRouter } from 'react-router-dom';
import { StorageProvider } from './contexts/StorageProvider';
import { ThemeProvider } from './contexts/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter>
      <StorageProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </StorageProvider>
    </HashRouter>
  </React.StrictMode>
);
