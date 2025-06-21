import { agentOrchestrator } from './agentOrchestrator';
import { snapshotManager } from './snapshotManager';

const USAGE_KEY = 'phillos_app_usage_v1';

class AppForgeService {
  private usage: Record<string, number> = {};

  constructor() {
    try {
      const raw = localStorage.getItem(USAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, number>;
        if (parsed && typeof parsed === 'object') this.usage = parsed;
      }
    } catch {
      this.usage = {};
    }
    agentOrchestrator.on('launch', e => this.logUsage(e.app));
  }

  private persist() {
    try {
      localStorage.setItem(USAGE_KEY, JSON.stringify(this.usage));
    } catch {
      // ignore
    }
  }

  private logUsage(app: string) {
    this.usage[app] = (this.usage[app] || 0) + 1;
    this.persist();
  }

  async build() {
    try {
      const res = await fetch('/api/appforge/build', { method: 'POST' });
      if (!res.ok) return false;
      snapshotManager.addSnapshot(new Date().toISOString());
      return true;
    } catch {
      return false;
    }
  }

  recommendApps() {
    const apps = [
      'home','copilot','agent','files','mail','gaming','timeai','genlab','mediasphere',
      'soundscape','visionvault','securecore','appforge','spacemanager','pulsemonitor',
      'brainpad','phone','settings'
    ];
    const usageArr = apps.map(a => ({ app: a, count: this.usage[a] || 0 }));
    usageArr.sort((a, b) => a.count - b.count);
    return usageArr.slice(0, 3).map(u => u.app);
  }

  rollback() {
    return snapshotManager.rollback();
  }
}

export const appForgeService = new AppForgeService();

agentOrchestrator.registerAction('appforge.build', async () => appForgeService.build());
agentOrchestrator.registerAction('smartrec.recommend', () => appForgeService.recommendApps());
agentOrchestrator.registerAction('appforge.rollback', () => appForgeService.rollback());
