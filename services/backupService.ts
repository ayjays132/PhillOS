import { agentOrchestrator } from './agentOrchestrator';

class BackupService {
  async exportSettings(): Promise<Record<string, any>> {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) return {};
      const data = await res.json();
      return data.settings || {};
    } catch {
      return {};
    }
  }

  async importSettings(data: Record<string, any>): Promise<boolean> {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: data }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export const backupService = new BackupService();

agentOrchestrator.registerAction('settings.export', () => backupService.exportSettings());
agentOrchestrator.registerAction('settings.import', params => backupService.importSettings(params?.settings || {}));
