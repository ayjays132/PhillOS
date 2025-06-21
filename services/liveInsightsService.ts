import { agentOrchestrator } from './agentOrchestrator';

export interface AudioInsight {
  energy: number;
  tempo: number;
}

class LiveInsightsService {
  private socket: WebSocket | null = null;
  private handlers = new Set<(i: AudioInsight) => void>();
  private subs = new Map<string, () => void>();

  private connect() {
    if (this.socket) return;
    const url = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/insights`;
    this.socket = new WebSocket(url);
    this.socket.onmessage = e => {
      try {
        const data = JSON.parse(e.data) as AudioInsight;
        this.handlers.forEach(h => h(data));
      } catch {}
    };
    this.socket.onclose = () => {
      this.socket = null;
      if (this.handlers.size) setTimeout(() => this.connect(), 1000);
    };
  }

  subscribe(handler: (i: AudioInsight) => void) {
    this.handlers.add(handler);
    this.connect();
    return () => {
      this.handlers.delete(handler);
      if (this.handlers.size === 0) this.socket?.close();
    };
  }

  addBusSubscriber(token: string) {
    const unsub = this.subscribe(i => {
      (agentOrchestrator as any).bus.emit('data', { taskId: token, data: i });
    });
    this.subs.set(token, unsub);
  }

  removeBusSubscriber(token: string) {
    const unsub = this.subs.get(token);
    if (unsub) {
      unsub();
      this.subs.delete(token);
    }
  }
}

export const liveInsightsService = new LiveInsightsService();

agentOrchestrator.registerAction('insights.subscribe', () => {
  const token = Date.now().toString(36) + Math.random().toString(36).slice(2);
  liveInsightsService.addBusSubscriber(token);
  return token;
});

agentOrchestrator.registerAction('insights.unsubscribe', params => {
  const token = String((params as any)?.token || '');
  liveInsightsService.removeBusSubscriber(token);
});
