export const checkForUpdate = async () => {
  const update = (window as any).updateServiceWorker as (() => Promise<void>) | undefined;
  if (update) await update();
};

export const clearCaches = async () => {
  const names = await caches.keys();
  await Promise.all(names.map(n => caches.delete(n)));
  location.reload();
};

import { agentOrchestrator } from './agentOrchestrator';

agentOrchestrator.registerAction('cache.check_update', () => checkForUpdate());
agentOrchestrator.registerAction('cache.clear', () => clearCaches());
