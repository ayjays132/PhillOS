import { invoke } from '@tauri-apps/api/tauri';
import { agentOrchestrator } from './agentOrchestrator';

class VaultService {
  async listDir(path: string) {
    return invoke('list_dir', { path });
  }

  async copyFile(src: string, dest: string) {
    return invoke('copy_file', { src, dest });
  }

  async moveFile(src: string, dest: string) {
    return invoke('move_file', { src, dest });
  }
}

export const vaultService = new VaultService();

agentOrchestrator.registerAction('vault.list', params => vaultService.listDir(String(params?.path || '.')));
agentOrchestrator.registerAction('vault.copy', params => vaultService.copyFile(String(params?.src || ''), String(params?.dest || '')));
agentOrchestrator.registerAction('vault.move', params => vaultService.moveFile(String(params?.src || ''), String(params?.dest || '')));
