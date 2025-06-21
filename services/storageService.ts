import { NavItem, WidgetOrder, PhoneSettings } from '../types';
import { agentOrchestrator } from './agentOrchestrator';

const WIDGET_ORDER_KEY = 'phillos_widget_order';
const DOCK_ITEMS_KEY = 'phillos_dock_items_v1';
const PHONE_SETTINGS_KEY = 'phillos_phone_settings_v1';
const MEMORY_WINDOWS_KEY = 'phillos_memory_windows_v1';
const THEME_KEY = 'phillos-theme';
const VOICE_ENGINE_KEY = 'phillos_voice_engine_v1';
const CURSOR_STYLE_KEY = 'phillos_cursor_style';

class StorageService {
  init() {
    // Placeholder for future initialization logic (e.g., loading from cloud)
    this.getWidgetOrder();
    this.getDockItems();
    this.getPhoneSettings();
    this.getVoiceEngine();
    this.getCursorStyle();
  }

  getWidgetOrder(): WidgetOrder | null {
    try {
      const raw = localStorage.getItem(WIDGET_ORDER_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as WidgetOrder;
    } catch {
      return null;
    }
  }

  setWidgetOrder(order: WidgetOrder) {
    try {
      localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(order));
    } catch {
      // ignore write errors
    }
  }

  getDockItems(): NavItem[] | null {
    try {
      const raw = localStorage.getItem(DOCK_ITEMS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as NavItem[];
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
    return null;
  }

  setDockItems(items: NavItem[]) {
    try {
      localStorage.setItem(DOCK_ITEMS_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }

  getPhoneSettings(): PhoneSettings | null {
    try {
      const raw = localStorage.getItem(PHONE_SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as PhoneSettings;
    } catch {
      return null;
    }
  }

  setPhoneSettings(settings: PhoneSettings) {
    try {
      localStorage.setItem(PHONE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }

  getMemoryWindows(): any[] | null {
    try {
      const raw = localStorage.getItem(MEMORY_WINDOWS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
    return null;
  }

  setMemoryWindows(windows: any[]) {
    try {
      localStorage.setItem(MEMORY_WINDOWS_KEY, JSON.stringify(windows));
    } catch {
      // ignore
    }
  }

  getVoiceEngine(): 'web' | 'whisper' | 'auto' | null {
    try {
      const mode = localStorage.getItem(VOICE_ENGINE_KEY);
      if (mode === 'web' || mode === 'whisper' || mode === 'auto') return mode as 'web' | 'whisper' | 'auto';
    } catch {
      // ignore
    }
    return null;
  }

  setVoiceEngine(engine: 'web' | 'whisper' | 'auto') {
    try {
      localStorage.setItem(VOICE_ENGINE_KEY, engine);
    } catch {
      // ignore
    }
  }

  async getCursorStyle(): Promise<'default' | 'svg' | null> {
    try {
      const stored = localStorage.getItem(CURSOR_STYLE_KEY);
      if (stored === 'default' || stored === 'svg') {
        return stored;
      }
    } catch {
      // ignore
    }
    return null;
  }

  async setCursorStyle(style: 'default' | 'svg') {
    try {
      localStorage.setItem(CURSOR_STYLE_KEY, style);
    } catch {
      // ignore
    }
  }

  async getTheme(): Promise<'light' | 'dark' | null> {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
    } catch {
      // ignore
    }

    try {
      const res = await fetch('/api/theme');
      if (!res.ok) return null;
      const data = await res.json();
      if (data && (data.theme === 'light' || data.theme === 'dark')) {
        localStorage.setItem(THEME_KEY, data.theme);
        return data.theme;
      }
    } catch {
      // ignore
    }
    return null;
  }

  async setTheme(theme: 'light' | 'dark') {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    try {
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
    } catch {
      // ignore
    }
  }
}

export const storageService = new StorageService();

agentOrchestrator.registerAction('storage.get_theme', () => storageService.getTheme());
agentOrchestrator.registerAction('storage.set_theme', params => storageService.setTheme(params?.theme as 'light' | 'dark'));
agentOrchestrator.registerAction('storage.get_cursor_style', () => storageService.getCursorStyle());
agentOrchestrator.registerAction('storage.set_cursor_style', params => storageService.setCursorStyle(params?.style as 'default' | 'svg'));
