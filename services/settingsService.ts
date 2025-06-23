import { storageService } from './storageService';

class SettingsService {
  async fetchTheme(): Promise<'light' | 'dark' | null> {
    try {
      const res = await fetch('/api/theme');
      if (!res.ok) return null;
      const data = await res.json();
      if (data && (data.theme === 'light' || data.theme === 'dark')) {
        storageService.setTheme(data.theme);
        return data.theme;
      }
    } catch {}
    return null;
  }

  async setTheme(theme: 'light' | 'dark') {
    storageService.setTheme(theme);
    try {
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
    } catch {}
  }

  async fetchOfflineMode(): Promise<boolean | null> {
    try {
      const res = await fetch('/api/offline');
      if (!res.ok) return null;
      const data = await res.json();
      if (typeof data.offline === 'boolean') {
        storageService.setOfflineMode(data.offline);
        return data.offline;
      }
    } catch {}
    return storageService.getOfflineMode();
  }

  async setOfflineMode(state: boolean) {
    storageService.setOfflineMode(state);
    try {
      await fetch('/api/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offline: state }),
      });
    } catch {}
  }

  async fetchGpuOverride(): Promise<string | null> {
    try {
      const res = await fetch('/api/gpu');
      if (!res.ok) return null;
      const data = await res.json();
      if (data && typeof data.gpu === 'string') {
        storageService.setGpuOverride(data.gpu);
        return data.gpu;
      }
    } catch {}
    return storageService.getGpuOverride();
  }

  async setGpuOverride(vendor: string) {
    storageService.setGpuOverride(vendor);
    try {
      await fetch('/api/gpu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gpu: vendor }),
      });
    } catch {}
  }

  async fetchDevMode(): Promise<boolean | null> {
    try {
      const res = await fetch('/api/devmode');
      if (!res.ok) return storageService.getDevMode();
      const data = await res.json();
      if (typeof data.devMode === 'boolean') {
        storageService.setDevMode(data.devMode);
        return data.devMode;
      }
    } catch {}
    return storageService.getDevMode();
  }

  async setDevMode(state: boolean) {
    storageService.setDevMode(state);
    try {
      await fetch('/api/devmode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ devMode: state }),
      });
    } catch {}
  }

  async fetchTelemetry(): Promise<boolean | null> {
    try {
      const res = await fetch('/api/telemetry');
      if (!res.ok) return storageService.getTelemetry();
      const data = await res.json();
      if (typeof data.telemetry === 'boolean') {
        storageService.setTelemetry(data.telemetry);
        return data.telemetry;
      }
    } catch {}
    return storageService.getTelemetry();
  }

  async setTelemetry(state: boolean) {
    storageService.setTelemetry(state);
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telemetry: state }),
      });
    } catch {}
  }
}

export const settingsService = new SettingsService();
