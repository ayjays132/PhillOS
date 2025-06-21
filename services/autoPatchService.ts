import { pulseMonitorService } from './pulseMonitorService';
import { agentOrchestrator } from './agentOrchestrator';

class AutoPatchService {
  private idleMinutes = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private intervalMs = 60000;

  constructor() {
    pulseMonitorService.subscribe(m => {
      if (m.load < 0.2 && m.memory < 0.5) {
        this.idleMinutes += 1;
      } else {
        this.idleMinutes = 0;
      }
    });
  }

  private async applyUpdate() {
    try {
      await fetch('/api/autopatch/run', { method: 'POST' });
    } catch {}
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      if (this.idleMinutes >= 5) {
        this.applyUpdate();
        this.idleMinutes = 0;
      }
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const autoPatchService = new AutoPatchService();

agentOrchestrator.registerAction('autopatch.start', () => autoPatchService.start());
agentOrchestrator.registerAction('autopatch.stop', () => autoPatchService.stop());
