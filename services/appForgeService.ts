class AppForgeService {
  async build() {
    try {
      const res = await fetch('/api/appforge/build', { method: 'POST' });
      if (!res.ok) return false;
      return true;
    } catch {
      return false;
    }
  }
}

import { agentOrchestrator } from './agentOrchestrator';

export const appForgeService = new AppForgeService();

agentOrchestrator.registerAction('appforge.build', async () => {
  return appForgeService.build();
});
