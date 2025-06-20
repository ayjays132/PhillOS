import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { pulseMonitorService } from '../../services/pulseMonitorService';
import { SystemMetrics } from '../../../services/modelManager';

export const PulseMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    const unsub = pulseMonitorService.subscribe(m => setMetrics(m));
    const unsubWarn = pulseMonitorService.onWarning(msg =>
      setAlerts(prev => [
        `${new Date().toLocaleTimeString()} - ${msg}`,
        ...prev.slice(0, 49),
      ]),
    );
    return () => {
      unsub();
      unsubWarn();
    };
  }, []);

  return (
    <AppPanel className="p-4 flex flex-col gap-2 overflow-auto">
        <h1 className="text-3xl font-bold mb-2">Pulse Monitor</h1>
        {metrics && (
          <>
            <p className="text-sm">Load: {metrics.load.toFixed(2)}</p>
            <p className="text-sm">Memory: {(metrics.memory * 100).toFixed(1)}%</p>
            <p className="text-sm">BPM: {metrics.bpm}</p>
          </>
        )}
        <h2 className="text-lg font-semibold mt-2">Alerts</h2>
        <ul className="text-xs space-y-1 overflow-auto flex-grow">
          {alerts.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
    </AppPanel>
  );
};

export default PulseMonitor;
