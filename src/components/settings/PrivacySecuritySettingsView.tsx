import React, { useEffect, useState } from 'react';
import { GlassCard } from '../GlassCard';
import { Shield } from 'lucide-react';
import { systemSettingsService } from '../../services/systemSettingsService';

export const PrivacySecuritySettingsView: React.FC = () => {
  const [perms, setPerms] = useState<Record<string, boolean>>({});

  useEffect(() => {
    systemSettingsService.getPermissions().then(setPerms);
  }, []);

  const toggle = (app: string) => {
    const next = !perms[app];
    setPerms({ ...perms, [app]: next });
    systemSettingsService.setPermission(app, next);
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
      <div className="text-sm">
        {Object.entries(perms).map(([app, allowed]) => (
          <label key={app} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allowed}
              onChange={() => toggle(app)}
            />
            <span>{app}</span>
          </label>
        ))}
      </div>
    </GlassCard>
  );
};

export default PrivacySecuritySettingsView;
