import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Shield } from 'lucide-react';
import { systemSettingsService } from '../../../services/systemSettingsService';
import { secureCoreService } from '../../../services/secureCoreService';

export const PrivacySecuritySettingsView: React.FC = () => {
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [firewall, setFirewall] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  useEffect(() => {
    systemSettingsService.getPermissions().then(setPerms);
    secureCoreService.getStatus().then(s => setFirewall(s.firewall));
  }, []);

  const setPermission = (app: string, allowed: boolean) => {
    setPerms({ ...perms, [app]: allowed });
    systemSettingsService.setPermission(app, allowed);
  };

  const toggleFirewall = async () => {
    const s = await secureCoreService.toggleFirewall();
    setFirewall(s.firewall);
  };

  const scan = async () => {
    const ok = await secureCoreService.scan();
    if (ok) setLastScan(new Date().toLocaleTimeString());
  };

  const enroll = async () => {
    await fetch('/api/biometrics/enroll', { method: 'POST' });
  };

  return (
    <GlassCard className="h-full flex flex-col gap-4">
      <div className="flex items-center mb-4">
        <Shield size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Privacy & Security</h1>
      </div>
      <button className="px-3 py-1 bg-white/20 rounded text-sm" onClick={enroll}>
        Enroll Biometrics
      </button>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={firewall} onChange={toggleFirewall} />
        <span>Firewall {firewall ? 'On' : 'Off'}</span>
      </label>
      <button
        className="px-2 py-1 text-xs rounded bg-blue-500 text-white w-max"
        onClick={scan}
      >
        Quick Scan
      </button>
      {lastScan && (
        <p className="text-xs text-white/70">Last scan: {lastScan}</p>
      )}
      <div className="text-sm mt-2 space-y-1">
        {Object.entries(perms).map(([app, allowed]) => (
          <div key={app} className="flex items-center gap-2">
            <span className="flex-grow">{app}</span>
            {allowed ? (
              <button
                className="px-2 py-0.5 text-xs rounded bg-red-600/60"
                onClick={() => setPermission(app, false)}
              >
                Revoke
              </button>
            ) : (
              <button
                className="px-2 py-0.5 text-xs rounded bg-green-600/60"
                onClick={() => setPermission(app, true)}
              >
                Grant
              </button>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};

export default PrivacySecuritySettingsView;
