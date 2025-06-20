// MemoryHub service manages a rolling window of time stamped memory entries
// and persists them via storageService so sessions survive reloads.
import { storageService } from './storageService';
import { agentOrchestrator } from './agentOrchestrator';

export interface MemoryWindow {
  timestamp: number;
  content: string;
}

const MEMORY_WINDOWS_KEY = 'phillos_memory_windows_v1';
const STYLE_PROFILE_KEY = 'phillos_style_profile_v1';

class MemoryHubService {
  private windows: MemoryWindow[] = [];
  private maxSize = 50;
  private styleProfile: string | null = null;

  init() {
    const stored = storageService.getMemoryWindows?.();
    if (Array.isArray(stored)) {
      this.windows = stored;
    } else {
      // fallback for older storageService implementations
      const raw = localStorage.getItem(MEMORY_WINDOWS_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as MemoryWindow[];
          if (Array.isArray(parsed)) {
            this.windows = parsed;
          }
        } catch {
          // ignore
        }
      }
    }
    try {
      const style = localStorage.getItem(STYLE_PROFILE_KEY);
      if (style) this.styleProfile = style;
    } catch {
      // ignore
    }
  }

  getWindows(): MemoryWindow[] {
    return [...this.windows];
  }

  getStyleProfile(): string | null {
    return this.styleProfile;
  }

  setStyleProfile(profile: string) {
    this.styleProfile = profile;
    try {
      localStorage.setItem(STYLE_PROFILE_KEY, profile);
    } catch {
      // ignore
    }
  }

  setMaxSize(size: number) {
    this.maxSize = size;
    this.trim();
  }

  addEntry(content: string) {
    this.windows.push({ timestamp: Date.now(), content });
    this.trim();
    this.persist();
  }

  clear() {
    this.windows = [];
    this.persist();
  }

  private trim() {
    if (this.windows.length > this.maxSize) {
      this.windows.splice(0, this.windows.length - this.maxSize);
    }
  }

  private persist() {
    if (storageService.setMemoryWindows) {
      storageService.setMemoryWindows(this.windows);
    } else {
      try {
        localStorage.setItem(MEMORY_WINDOWS_KEY, JSON.stringify(this.windows));
      } catch {
        // ignore
      }
    }
  }
}

export const memoryHubService = new MemoryHubService();

agentOrchestrator.registerAction('memoryhub.add_entry', params => memoryHubService.addEntry(String(params?.content || '')));
agentOrchestrator.registerAction('memoryhub.get_windows', () => memoryHubService.getWindows());
agentOrchestrator.registerAction('memoryhub.clear', () => memoryHubService.clear());
agentOrchestrator.registerAction('memoryhub.get_style', () => memoryHubService.getStyleProfile());
agentOrchestrator.registerAction('memoryhub.set_style', params => memoryHubService.setStyleProfile(String(params?.profile || '')));
