import { useState, useEffect, useCallback } from 'react';
import { StratumConfig } from '../types';

export interface WidgetOrder {
  [stratumId: string]: string[];
}

const STORAGE_KEY = 'phillos_widget_order';

function buildDefaultOrder(strata: StratumConfig[]): WidgetOrder {
  const order: WidgetOrder = {};
  strata.forEach((s) => {
    order[s.id] = s.widgets.map((w) => w.id);
  });
  return order;
}

export function useWidgetLayout(strata: StratumConfig[]) {
  const [order, setOrder] = useState<WidgetOrder>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WidgetOrder;
        return parsed;
      }
    } catch {
      // ignore
    }
    return buildDefaultOrder(strata);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
    } catch {
      // ignore
    }
  }, [order]);

  const moveWidget = useCallback((stratumId: string, from: number, to: number) => {
    setOrder((prev) => {
      const ids = [...(prev[stratumId] || [])];
      const [removed] = ids.splice(from, 1);
      ids.splice(to, 0, removed);
      return { ...prev, [stratumId]: ids };
    });
  }, []);

  const orderedWidgets = useCallback((stratum: StratumConfig) => {
    const orderIds = order[stratum.id] || [];
    const widgetMap = new Map(stratum.widgets.map((w) => [w.id, w]));
    return orderIds
      .map((id) => widgetMap.get(id))
      .filter((w): w is NonNullable<typeof w> => Boolean(w));
  }, [order, strata]);

  return { order, moveWidget, orderedWidgets };
}
