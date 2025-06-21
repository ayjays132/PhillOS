import React, { useState, useEffect } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { appForgeService } from '../../services/appForgeService';
import { pulseService } from '../../services/pulseService';

export const AppForge: React.FC = () => {
  const [status, setStatus] = useState('');
  const [alert, setAlert] = useState('');

  useEffect(() => {
    const unsub = pulseService.onAlert(msg => setAlert(msg));
    return () => unsub();
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
        {alert && <p className="text-xs text-red-500 mt-1">{alert}</p>}
    </AppPanel>
  );
};

export default AppForge;
