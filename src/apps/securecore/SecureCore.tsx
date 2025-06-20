import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { secureCoreService } from '../../services/secureCoreService';

export const SecureCore: React.FC = () => {
  const [firewall, setFirewall] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  useEffect(() => {
    secureCoreService.getStatus().then(s => setFirewall(s.firewall));
  }, []);

  const toggle = async () => {
    const s = await secureCoreService.toggleFirewall();
    setFirewall(s.firewall);
  };

  const scan = async () => {
    const ok = await secureCoreService.scan();
    if (ok) setLastScan(new Date().toLocaleTimeString());
  };

  return (
    <div className="p-4 h-full">
      <GlassCard className="h-full flex flex-col">
        <h1 className="text-3xl font-bold mb-4">SecureCore</h1>
        <label className="inline-flex items-center gap-2 mb-4 text-sm">
          <input type="checkbox" checked={firewall} onChange={toggle} />
          <span>Firewall {firewall ? 'On' : 'Off'}</span>
        </label>
        <button onClick={scan} className="px-2 py-1 text-xs rounded bg-blue-500 text-white w-max mb-2">Scan</button>
        {lastScan && <p className="text-xs text-white/70">Last scan: {lastScan}</p>}
      </GlassCard>
    </div>
  );
};

export default SecureCore;
