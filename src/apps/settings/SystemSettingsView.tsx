import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Cpu } from 'lucide-react';
import MemorySettings from '../../components/MemorySettings';
import { settingsService } from '../../../services/settingsService';
import { storageService } from '../../../services/storageService';
import { systemSettingsService } from '../../../services/systemSettingsService';

export const SystemSettingsView: React.FC = () => {
  const [offline, setOffline] = useState<boolean>(storageService.getOfflineMode() ?? false);
  const [gpu, setGpu] = useState<string>(storageService.getGpuOverride() || 'auto');
  const [usage, setUsage] = useState<Record<string, number>>({});
  const [profile, setProfile] = useState('balanced');
  const [devMode, setDevMode] = useState(storageService.getDevMode() ?? false);

  useEffect(() => {
    settingsService.fetchOfflineMode().then(v => v !== null && setOffline(v));
    settingsService.fetchGpuOverride().then(v => v && setGpu(v));
    settingsService.fetchDevMode().then(v => v !== null && setDevMode(v));
    systemSettingsService.getStorageUsage().then(u => u && setUsage(u));
  }, []);

  const updateOffline = (v: boolean) => {
    setOffline(v);
    settingsService.setOfflineMode(v);
  };

  const updateGpu = (v: string) => {
    setGpu(v);
    settingsService.setGpuOverride(v);
  };

  return (
    <GlassCard className="h-full flex flex-col gap-4">
      <div className="flex items-center mb-4">
        <Cpu size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">System Settings</h1>
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" checked={offline} onChange={e => updateOffline(e.target.checked)} />
        <span>Offline Mode</span>
      </label>
      <label className="text-sm flex flex-col gap-1">
        <span>GPU Override</span>
        <select
          value={gpu}
          onChange={e => updateGpu(e.target.value)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        >
          <option value="auto">Auto</option>
          <option value="nvidia">NVIDIA</option>
          <option value="amd">AMD</option>
          <option value="intel">Intel</option>
          <option value="none">None</option>
        </select>
      </label>
      <label className="text-sm flex flex-col gap-1">
        <span>Power Profile</span>
        <select
          value={profile}
          onChange={e => setProfile(e.target.value)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        >
          <option value="balanced">Balanced</option>
          <option value="performance">Performance</option>
          <option value="powersave">Power Save</option>
        </select>
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={devMode}
          onChange={e => {
            setDevMode(e.target.checked);
            settingsService.setDevMode(e.target.checked);
          }}
        />
        <span>Developer Mode</span>
      </label>
      <div className="text-sm">
        <div className="font-semibold mb-1">Storage Usage</div>
        <ul className="pl-4 list-disc">
          {Object.entries(usage).map(([dir, size]) => (
            <li key={dir}>{dir}: {Math.round(size / 1024)} KB</li>
          ))}
        </ul>
      </div>
      <MemorySettings />
    </GlassCard>
  );
};

export default SystemSettingsView;
