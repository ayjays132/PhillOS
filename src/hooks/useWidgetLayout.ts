import { useState, useEffect, useCallback } from 'react';
import { StratumConfig, WidgetOrder } from '../types';
import { storageService } from '../../services/storageService';

function buildDefaultOrder(strata: StratumConfig[]): WidgetOrder {
  const order: WidgetOrder = {};
  strata.forEach((s) => {
    order[s.id] = s.widgets.map((w) => w.id);
  });
  return order;
}

export function useWidgetLayout(strata: StratumConfig[]) {
  const [order, setOrder] = useState<WidgetOrder>(() => {
    const stored = storageService.getWidgetOrder();
    return stored || buildDefaultOrder(strata);
  });

  useEffect(() => {
    storageService.setWidgetOrder(order);
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
