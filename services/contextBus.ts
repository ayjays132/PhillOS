import { agentOrchestrator } from './agentOrchestrator';

class ContextBus extends EventTarget {
  private store = new Map<string, unknown>();

  publish(key: string, value: unknown): void {
    this.store.set(key, value);
    this.dispatchEvent(new CustomEvent(key, { detail: value }));
  }

  subscribe<T>(key: string, handler: (value: T) => void): () => void {
    const listener = (e: Event) => {
      handler((e as CustomEvent).detail as T);
    };
    this.addEventListener(key, listener);
    return () => this.removeEventListener(key, listener);
  }

  get(key: string): unknown {
    return this.store.get(key);
  }
}

export const contextBus = new ContextBus();

agentOrchestrator.registerAction('context.set', params => {
  const key = String(params?.key || '');
  contextBus.publish(key, (params as any).value);
});

agentOrchestrator.registerAction('context.get', params => {
  const key = String(params?.key || '');
  return contextBus.get(key);
});

