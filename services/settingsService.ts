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
}

export const settingsService = new SettingsService();
