import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { spaceManagerService } from '../../services/spaceManagerService';

export const SpaceManager: React.FC = () => {
  const [usage, setUsage] = useState({ used: 0, total: 0 });

  useEffect(() => {
    spaceManagerService.getUsage().then(setUsage);
  }, []);

  const pct = usage.total ? Math.round((usage.used / usage.total) * 100) : 0;

  return (
    <AppPanel className="items-center justify-center">
        <h1 className="text-3xl font-bold mb-2">SpaceManager</h1>
        <div className="w-full bg-white/10 rounded h-3 mt-2">
          <div style={{ width: `${pct}%` }} className="h-full bg-blue-500 rounded" />
        </div>
        <p className="text-sm mt-2">{usage.used} / {usage.total} GB ({pct}%)</p>
    </AppPanel>
  );
};

export default SpaceManager;
