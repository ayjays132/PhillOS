import { invoke } from '@tauri-apps/api/tauri';
import { agentOrchestrator } from './agentOrchestrator';

class FileTagService {
  async getTags(path: string): Promise<string[]> {
    try {
      const res = await fetch(`/api/filetags?path=${encodeURIComponent(path)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tags)) return data.tags;
      }
    } catch {}
    return [];
  }

  async setTags(path: string, tags: string[]) {
    try {
      await fetch('/api/filetags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path, tags }),
      });
    } catch {
      // ignore
    }
  }

  async tagFile(path: string): Promise<string[]> {
    const existing = await this.getTags(path);
    if (existing.length) return existing;
    try {
      const tags = await invoke<string[]>('smart_tags', { path });
      const arr = Array.isArray(tags) ? tags : [];
      await this.setTags(path, arr);
      return arr;
    } catch {
      return [];
    }
  }
}

export const fileTagService = new FileTagService();

agentOrchestrator.registerAction('filetag.tag', params => {
  return fileTagService.tagFile(String(params?.path || ''));
});
