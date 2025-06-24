import { invoke } from '@tauri-apps/api/tauri';

type Handler = (offline: boolean) => void;

class OfflineService {
  private offline = !navigator.onLine;
  private handlers = new Set<Handler>();
  private pollId: number | null = null;

  constructor() {
    this.init();
    window.addEventListener('online', this.handleNetworkChange);
    window.addEventListener('offline', this.handleNetworkChange);
  }

  private async init() {
    await this.updateState();
    this.startPolling();
  }

  private handleNetworkChange = () => {
    this.updateState();
  };

  private async updateState() {
    try {
      const state =
        (await invoke<boolean>('system.offline_state')) || !navigator.onLine;
      if (state !== this.offline) {
        this.offline = state;
        this.handlers.forEach(h => h(state));
      }
    } catch {
      // ignore errors, assume unchanged
    }
  }

  private startPolling() {
    if (this.pollId === null) {
      this.pollId = window.setInterval(() => this.updateState(), 10000);
    }
  }

  subscribe(handler: Handler) {
    this.handlers.add(handler);
    handler(this.offline);
    return () => this.handlers.delete(handler);
  }

  isOffline() {
    return this.offline;
  }
}

export const offlineService = new OfflineService();
