import { agentService, AgentAction } from './agentService';
import { AIModelPreference } from '../types';

export interface LaunchEvent {
  app: string;
  params?: Record<string, unknown>;
  taskId: string;
}

export interface DataEvent {
  taskId: string;
  data: unknown;
}

export interface CompletionEvent {
  taskId: string;
  result?: unknown;
}

export type OrchestratorEvents = {
  launch: LaunchEvent;
  data: DataEvent;
  complete: CompletionEvent;
  fail: CompletionEvent & { error?: unknown };
  action: { action: AgentAction; taskId: string };
};

export type EventKeys = keyof OrchestratorEvents;
export type EventHandler<K extends EventKeys> = (payload: OrchestratorEvents[K]) => void;

class EventBus {
  private handlers: { [K in EventKeys]?: EventHandler<K>[] } = {};

  on<K extends EventKeys>(event: K, handler: EventHandler<K>): void {
    (this.handlers[event] ||= []).push(handler);
  }

  off<K extends EventKeys>(event: K, handler: EventHandler<K>): void {
    this.handlers[event] = (this.handlers[event] || []).filter(h => h !== handler);
  }

  emit<K extends EventKeys>(event: K, payload: OrchestratorEvents[K]): void {
    (this.handlers[event] || []).forEach(h => h(payload));
  }
}

export interface OrchestratorTask {
  id: string;
  action: AgentAction;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

type ActionHandler = (params: Record<string, unknown> | undefined, taskId: string) => Promise<unknown> | unknown;

class AgentOrchestrator {
  private bus = new EventBus();
  private tasks = new Map<string, OrchestratorTask>();
  private actions: Record<string, { handler: ActionHandler; description?: string }> = {};

  on<K extends EventKeys>(event: K, handler: EventHandler<K>): void {
    this.bus.on(event, handler);
  }

  off<K extends EventKeys>(event: K, handler: EventHandler<K>): void {
    this.bus.off(event, handler);
  }

  getTask(id: string): OrchestratorTask | undefined {
    return this.tasks.get(id);
  }

  registerAction(name: string, handler: ActionHandler, description?: string) {
    this.actions[name] = { handler, description };
  }

  registerActions(prefix: string, actions: Record<string, ActionHandler>) {
    for (const [name, handler] of Object.entries(actions)) {
      this.registerAction(`${prefix}.${name}`, handler);
    }
  }

  listActions(): string[] {
    return Object.keys(this.actions);
  }

  getActionInfo() {
    return Object.entries(this.actions).map(([name, { description }]) => ({ name, description }));
  }

  async processIntent(text: string, pref: AIModelPreference = 'local'): Promise<OrchestratorTask | null> {
    const action = await agentService.processCommand(text, pref, this.listActions());
    if (!action) return null;
    const taskId = Date.now().toString();
    const task: OrchestratorTask = { id: taskId, action, status: 'pending' };
    this.tasks.set(taskId, task);

    this.bus.emit('action', { action, taskId });

    if (action.action === 'open_app' && typeof action.parameters?.app === 'string') {
      this.bus.emit('launch', { app: action.parameters.app, params: action.parameters, taskId });
      task.status = 'running';
    } else if (this.actions[action.action]) {
      task.status = 'running';
      try {
        const result = await this.actions[action.action].handler(action.parameters, taskId);
        this.markComplete(taskId, result);
      } catch (err) {
        this.markFailed(taskId, err);
      }
    }

    return task;
  }

  markComplete(taskId: string, result?: unknown) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    task.status = 'completed';
    this.bus.emit('complete', { taskId, result });
  }

  markFailed(taskId: string, error?: unknown) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    task.status = 'failed';
    this.bus.emit('fail', { taskId, result: undefined, error });
  }
}

export const agentOrchestrator = new AgentOrchestrator();
