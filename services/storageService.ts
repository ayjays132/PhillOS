import { NavItem, WidgetOrder, PhoneSettings } from '../types';

const WIDGET_ORDER_KEY = 'phillos_widget_order';
const DOCK_ITEMS_KEY = 'phillos_dock_items_v1';
const PHONE_SETTINGS_KEY = 'phillos_phone_settings_v1';
const MEMORY_WINDOWS_KEY = 'phillos_memory_windows_v1';

class StorageService {
  init() {
    // Placeholder for future initialization logic (e.g., loading from cloud)
    this.getWidgetOrder();
    this.getDockItems();
    this.getPhoneSettings();
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
}

export const storageService = new StorageService();
