class SnapshotManager {
  private snapshots: string[] = [];
  private readonly KEY = 'phillos_app_snapshots_v1';

  constructor() {
    this.load();
  }

  private load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as string[];
        if (Array.isArray(parsed)) this.snapshots = parsed;
      }
    } catch {
      this.snapshots = [];
    }
  }

  private persist() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.snapshots));
    } catch {
      // ignore
    }
  }

  addSnapshot(data: string) {
    this.snapshots.push(data);
    if (this.snapshots.length > 20) this.snapshots.shift();
    this.persist();
  }

  list() {
    return [...this.snapshots];
  }

  rollback() {
    if (this.snapshots.length < 2) return null;
    this.snapshots.pop();
    const current = this.snapshots[this.snapshots.length - 1];
    this.persist();
    return current;
  }
}

export const snapshotManager = new SnapshotManager();
