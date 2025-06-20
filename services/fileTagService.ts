import { invoke } from '@tauri-apps/api/tauri';

class FileTagService {
  async tagFile(path: string): Promise<string[]> {
    try {
      const tags = await invoke<string[]>('smart_tags', { path });
      return Array.isArray(tags) ? tags : [];
    } catch {
      return [];
    }
  }
}

export const fileTagService = new FileTagService();
