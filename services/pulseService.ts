import { SystemMetrics } from './modelManager';

class PulseService {
  private socket: WebSocket | null = null;
  private history: SystemMetrics[] = [];
  private handlers = new Set<(m: SystemMetrics) => void>();
  private alertHandlers = new Set<(msg: string) => void>();

  private connect() {
    if (this.socket) return;
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/pulse`;
    this.socket = new WebSocket(url);
    this.socket.onmessage = e => {
      try {
        const data = JSON.parse(e.data) as SystemMetrics;
        this.history.push(data);
        if (this.history.length > 60) this.history.shift();
        this.handlers.forEach(h => h(data));
        this.checkAlerts();
      } catch {
        // ignore
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

  onAlert(handler: (msg: string) => void) {
    this.alertHandlers.add(handler);
    return () => this.alertHandlers.delete(handler);
  }

  private checkAlerts() {
    const latest = this.history[this.history.length - 1];
    if (!latest) return;
    if (latest.load > 0.8) this.emitAlert('High CPU load');
    if (latest.memory > 0.9) this.emitAlert('High memory usage');
  }

  private emitAlert(msg: string) {
    this.alertHandlers.forEach(h => h(msg));
  }

  getTrends() {
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1);
    return {
      cpu: avg(this.history.map(h => h.load)),
      memory: avg(this.history.map(h => h.memory)),
    };
  }
}

export const pulseService = new PulseService();
