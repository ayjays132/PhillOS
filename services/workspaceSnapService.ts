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

  async save(name: string, layout: WindowLayout[]) {
    this.snaps[name] = layout;
    this.persist();
    try {
      await fetch('/api/spacemanager/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, layout }),
      });
    } catch {
      // ignore network errors
    }
  }

  async loadSnapshot(name: string): Promise<WindowLayout[] | null> {
    try {
      const res = await fetch(`/api/spacemanager/snapshot?name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = (await res.json()) as { layout: WindowLayout[] };
        this.snaps[name] = data.layout;
        this.persist();
        return [...data.layout];
      }
    } catch {
      // ignore
    }
    const snap = this.snaps[name];
    return snap ? [...snap] : null;
  }

  async list(): Promise<string[]> {
    try {
      const res = await fetch('/api/spacemanager/snapshots');
      if (res.ok) {
        const data = (await res.json()) as { workspaces: string[] };
        return data.workspaces;
      }
    } catch {
      // ignore
    }
    return Object.keys(this.snaps);
  }

  getGroups(name: string): number[] {
    const snap = this.snaps[name];
    if (!snap) return [];
    const set = new Set<number>();
    snap.forEach(w => set.add(w.group ?? 0));
    return Array.from(set).sort((a, b) => a - b);
  }

  switchGroup(name: string, group: number): WindowLayout[] | null {
    const snap = this.snaps[name];
    if (!snap) return null;
    return snap.filter(w => (w.group ?? 0) === group).map(w => ({ ...w }));
  }
}

export const workspaceSnapService = new WorkspaceSnapService();

agentOrchestrator.registerAction('workspace.save', params => {
  return workspaceSnapService.save(
    String(params?.name || 'default'),
    (params?.layout as WindowLayout[]) ?? [],
  );
});

agentOrchestrator.registerAction('workspace.load', params => {
  return workspaceSnapService.loadSnapshot(String(params?.name || 'default'));
});

