import { agentOrchestrator } from './agentOrchestrator';
import { processMetrics, onAnomaly, SystemMetrics } from './modelManager';

class PulseMonitorService {
  private socket: WebSocket | null = null;
  private handlers = new Set<(m: SystemMetrics) => void>();
  private warningHandlers = new Set<(msg: string) => void>();

  constructor() {
    onAnomaly((msg) => {
      this.warningHandlers.forEach(h => h(msg));
    });
  }

  private connect() {
    if (this.socket) return;
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/pulse`;
    this.socket = new WebSocket(url);
    this.socket.onmessage = e => {
      try {
        const data = JSON.parse(e.data) as SystemMetrics;
        this.handlers.forEach(h => h(data));
        processMetrics(data);
      } catch {
        // ignore malformed data
      }
    };
    this.socket.onclose = () => {
      this.socket = null;
      if (this.handlers.size) setTimeout(() => this.connect(), 1000);
    };
  }

  subscribe(handler: (m: SystemMetrics) => void) {
    this.handlers.add(handler);
    this.connect();
    return () => {
      this.handlers.delete(handler);
      if (this.handlers.size === 0) this.socket?.close();
    };
  }

  onWarning(handler: (msg: string) => void) {
    this.warningHandlers.add(handler);
    return () => this.warningHandlers.delete(handler);
  }
  async getStatus() {
    try {
      const res = await fetch('/api/pulsemonitor/status');
      if (!res.ok) return { bpm: 0 };
      return await res.json();
    } catch {
      return { bpm: 0 };
    }
  }
}

export const pulseMonitorService = new PulseMonitorService();

agentOrchestrator.registerAction('pulse.get_status', () => pulseMonitorService.getStatus());
