import { storageService } from './storageService';

class SystemSettingsService {
  async getTime(): Promise<string | null> {
    try {
      const res = await fetch('/api/time');
      if (!res.ok) return null;
      const data = await res.json();
      return data.time;
    } catch {
      return null;
    }
  }

  async setTime(time: string) {
    try {
      await fetch('/api/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time }),
      });
    } catch {}
  }

  async getLocale(): Promise<{ region: string; language: string } | null> {
    try {
      const res = await fetch('/api/locale');
      if (!res.ok) return null;
      const data = await res.json();
      return data.locale;
    } catch {
      return null;
    }
  }

  async setLocale(locale: { region: string; language: string }) {
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      });
    } catch {}
  }

  async getStorageUsage(): Promise<Record<string, number> | null> {
    try {
      const res = await fetch('/api/storage/usage');
      if (!res.ok) return null;
      const data = await res.json();
      return data.usage;
    } catch {
      return null;
    }
  }

  async getStorageStats(): Promise<{ total: number; free: number } | null> {
    try {
      const res = await fetch('/api/storage/stats');
      if (!res.ok) return null;
      const data = await res.json();
      return data.stats;
    } catch {
      return null;
    }
  }

  async getBatteryInfo(): Promise<{ level: number; charging: boolean } | null> {
    try {
      const res = await fetch('/api/power/battery');
      if (!res.ok) return null;
      const data = await res.json();
      return data.battery;
    } catch {
      return null;
    }
  }

  async getPowerProfile(): Promise<string | null> {
    try {
      const res = await fetch('/api/power/profile');
      if (!res.ok) return null;
      const data = await res.json();
      return data.profile;
    } catch {
      return null;
    }
  }

  async setPowerProfile(profile: string) {
    try {
      await fetch('/api/power/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile }),
      });
    } catch {}
  }

  async getPermissions(): Promise<Record<string, boolean>> {
    try {
      const res = await fetch('/api/permissions');
      if (!res.ok) return {};
      const data = await res.json();
      return data.permissions || {};
    } catch {
      return {};
    }
  }

  async setPermission(app: string, granted: boolean) {
    try {
      await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app, granted }),
      });
    } catch {}
  }

  async getNetworkStats(): Promise<{ name: string; rx: number; tx: number }[] | null> {
    try {
      const res = await fetch('/api/network/stats');
      if (!res.ok) return null;
      const data = await res.json();
      return data.stats;
    } catch {
      return null;
    }
  }

  async setTethering(state: boolean) {
    try {
      await fetch('/api/network/tethering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tethering: state }),
      });
    } catch {}
  }
}

export const systemSettingsService = new SystemSettingsService();
