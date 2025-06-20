import { useState, useEffect, useCallback } from 'react';
import { NavItem } from '../types';
import { storageService } from '../../services/storageService';
import { Settings, Files, BotMessageSquare, LayoutGrid, MonitorPlay, Mail, BrainCircuit, Phone, FlaskConical } from 'lucide-react';

export const EXTERNAL_ITEM_TYPE = 'NEW_DOCK_ITEM';

const DEFAULT_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', path: '/home', icon: LayoutGrid },
  { id: 'copilot', label: 'AI CoPilot', path: '/copilot', icon: BotMessageSquare },
  { id: 'agent', label: 'Agent', path: '/agent', icon: BrainCircuit },
  { id: 'files', label: 'Files', path: '/files', icon: Files },
  { id: 'mail', label: 'Mail', path: '/mail', icon: Mail },
  { id: 'gaming', label: 'Gaming', path: '/gaming', icon: MonitorPlay },
  { id: 'genlab', label: 'GenLab', path: '/genlab', icon: FlaskConical },
  { id: 'phone', label: 'Phone', path: '/phone', icon: Phone },
  { id: 'settings', label: 'Settings', path: '/settings', icon: Settings },
];

export function useDock() {
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    const stored = storageService.getDockItems();
    if (stored && Array.isArray(stored) && stored.every(i => i && i.id && i.path)) {
      return stored;
    }
    return DEFAULT_ITEMS;
  });

  useEffect(() => {
    storageService.setDockItems(navItems);
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
