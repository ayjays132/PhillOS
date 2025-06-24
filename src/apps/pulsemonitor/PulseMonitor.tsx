import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { pulseMonitorService } from '../../services/pulseMonitorService';
import { SystemMetrics } from '../../../services/modelManager';

export const PulseMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [history, setHistory] = useState<SystemMetrics[]>([]);
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    const unsub = pulseMonitorService.subscribe(m => {
      setMetrics(m);
      setHistory(h => {
        const arr = [...h, m];
        if (arr.length > 60) arr.shift();
        return arr;
      });
    });
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

  useEffect(() => {
    if (!history.length) return;
    const recent = history.slice(-10);
    const avgLoad = recent.reduce((a, b) => a + b.load, 0) / recent.length;
    const avgMem = recent.reduce((a, b) => a + b.memory, 0) / recent.length;
    const latest = history[history.length - 1];
    const newTips: string[] = [];
    if (avgLoad > 0.8) newTips.push('Close unused apps to reduce CPU load');
    if (avgMem > 0.9) newTips.push('Consider freeing memory');
    if (latest.anomaly && latest.anomaly > 0.7)
      newTips.push('Investigate unusual activity');
    setTips(newTips);
  }, [history]);

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
        {tips.length > 0 && (
          <>
            <h2 className="text-lg font-semibold mt-2">OptimizeIQ</h2>
            <ul className="text-xs list-disc list-inside">
              {tips.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
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
