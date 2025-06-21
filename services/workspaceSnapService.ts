import { agentOrchestrator } from './agentOrchestrator';

export interface WindowLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  group?: number;
}

interface Snapshots {
  [name: string]: WindowLayout[];
}

class WorkspaceSnapService {
  private readonly KEY = 'phillos_workspace_snaps_v1';
  private snaps: Snapshots = {};

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const data = JSON.parse(raw) as Snapshots;
        if (data && typeof data === 'object') this.snaps = data;
      }
    } catch {
      this.snaps = {};
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.snaps));
    } catch {
      // ignore
    }
  }

  save(name: string, layout: WindowLayout[]) {
    this.snaps[name] = layout;
    this.persist();
  }

  loadSnapshot(name: string): WindowLayout[] | null {
    const snap = this.snaps[name];
    return snap ? [...snap] : null;
  }

  list(): string[] {
    return Object.keys(this.snaps);
  }
}

export const workspaceSnapService = new WorkspaceSnapService();

agentOrchestrator.registerAction('workspace.save', params => {
  workspaceSnapService.save(String(params?.name || 'default'), params?.layout as WindowLayout[] ?? []);
});

agentOrchestrator.registerAction('workspace.load', params => {
  return workspaceSnapService.loadSnapshot(String(params?.name || 'default'));
});

