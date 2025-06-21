import React, { useState, useEffect } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { appForgeService } from '../../services/appForgeService';
import { pulseService } from '../../services/pulseService';
import { HealthMonitor } from '../../components/HealthMonitor';

export const AppForge: React.FC = () => {
  const [status, setStatus] = useState('');
  const [alert, setAlert] = useState('');
  const [recommended, setRecommended] = useState<string[]>([]);
  const [trends, setTrends] = useState({ cpu: 0, memory: 0 });

  useEffect(() => {
    setRecommended(appForgeService.recommendApps());
    const unsubAlert = pulseService.onAlert(msg => setAlert(msg));
    const unsubMetrics = pulseService.subscribe(() => {
      setTrends(pulseService.getTrends());
    });
    setTrends(pulseService.getTrends());
    return () => {
      unsubAlert();
      unsubMetrics();
    };
  }, []);

  const build = async () => {
    const ok = await appForgeService.build();
    setStatus(ok ? 'Build succeeded' : 'Build failed');
  };

  return (
    <AppPanel className="items-center justify-center">
        <h1 className="text-3xl font-bold mb-2">AppForge</h1>
        <button onClick={build} className="px-3 py-1 rounded bg-blue-500 text-white mb-2">Build</button>
        {status && <p className="text-sm">{status}</p>}
        {recommended.length > 0 && (
          <ul className="text-xs mt-2 space-y-1">
            {recommended.map(app => (
              <li key={app}>{app}</li>
            ))}
          </ul>
        )}
        <HealthMonitor trends={trends} />
        {alert && <p className="text-xs text-red-500 mt-1">{alert}</p>}
    </AppPanel>
  );
};

export default AppForge;
