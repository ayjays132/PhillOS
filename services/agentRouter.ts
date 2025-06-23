import { agentOrchestrator } from './agentOrchestrator';
import { streamBus } from './streamBus';

interface Route {
  from: string;
  to: string;
  transform?: (data: unknown) => Record<string, unknown>;
}

class AgentRouter {
  private routes = new Map<string, Route>();
  private lastSent = new Map<string, number>();

  constructor() {
    agentOrchestrator.on('launch', e => {
      // apps could listen for this via contextBus or other mechanisms
      console.log('launch', e.app);
    });
    agentOrchestrator.on('data', e => {
      const route = this.routes.get(`data:${e.taskId}`);
      if (!route) return;
      const now = Date.now();
      const last = this.lastSent.get(route.to) || 0;
      if (now - last < 100) return;
      this.lastSent.set(route.to, now);
      try {
        const payload = route.transform ? route.transform(e.data) : e.data;
        streamBus.publish({ from: route.from, to: route.to, payload });
      } catch (err) {
        console.error('agentRouter stream error', err);
      }
    });
    agentOrchestrator.on('complete', e => {
      const task = agentOrchestrator.getTask(e.taskId);
      if (!task) return;
      const route = this.routes.get(task.action.action);
      if (route) {
        const params = route.transform ? route.transform(e.result) : { data: e.result };
        agentOrchestrator.processIntent(
          JSON.stringify({ action: route.to, parameters: params })
        );
      }
    });
  }

  addRoute(from: string, to: string, transform?: (data: unknown) => Record<string, unknown>) {
    this.routes.set(from, { from, to, transform });
  }
}

export const agentRouter = new AgentRouter();

// Example: after tagging a file, email the tags
agentRouter.addRoute('vault.smartTags', 'inbox.send', result => ({ body: Array.isArray(result) ? result.join(', ') : String(result) }));
