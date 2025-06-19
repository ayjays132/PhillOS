import { useState, useEffect, useCallback } from 'react';
import { NavItem } from '../types';
import { Settings, Files, BotMessageSquare, LayoutGrid, MonitorPlay, Mail, BrainCircuit } from 'lucide-react';

const DEFAULT_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', path: '/home', icon: LayoutGrid },
  { id: 'copilot', label: 'AI CoPilot', path: '/copilot', icon: BotMessageSquare },
  { id: 'agent', label: 'Agent', path: '/agent', icon: BrainCircuit },
  { id: 'files', label: 'Files', path: '/files', icon: Files },
  { id: 'mail', label: 'Mail', path: '/mail', icon: Mail },
  { id: 'gaming', label: 'Gaming', path: '/gaming', icon: MonitorPlay },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

const STORAGE_KEY = 'phillos_dock_items_v1';

export function useDock() {
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as NavItem[];
        if (Array.isArray(parsed) && parsed.every(i => i && i.id && i.path)) {
          return parsed;
        }
      }
    } catch {
      // ignore parsing errors
    }
    return DEFAULT_ITEMS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(navItems));
    } catch {
      // ignore
    }
  }, [navItems]);

  const moveDockItem = useCallback((from: number, to: number) => {
    setNavItems(prev => {
      const items = [...prev];
      const [removed] = items.splice(from, 1);
      items.splice(to, 0, removed);
      return items;
    });
  }, []);

  const addDockItem = useCallback((item: NavItem) => {
    setNavItems(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeDockItem = useCallback((id: string) => {
    setNavItems(prev => prev.filter(i => i.id !== id));
  }, []);

  return { navItems, moveDockItem, addDockItem, removeDockItem };
}
