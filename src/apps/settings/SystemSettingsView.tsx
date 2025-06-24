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
  const [stats, setStats] = useState<{ total: number; free: number } | null>(null);
  const [battery, setBattery] = useState<{ level: number; charging: boolean } | null>(null);
  const [profile, setProfile] = useState('balanced');
  const [devMode, setDevMode] = useState(storageService.getDevMode() ?? false);

  useEffect(() => {
    settingsService.fetchOfflineMode().then(v => v !== null && setOffline(v));
    settingsService.fetchGpuOverride().then(v => v && setGpu(v));
    settingsService.fetchDevMode().then(v => v !== null && setDevMode(v));
    systemSettingsService.getStorageUsage().then(u => u && setUsage(u));
    systemSettingsService.getStorageStats().then(s => s && setStats(s));
    systemSettingsService.getBatteryInfo().then(b => b && setBattery(b));
    systemSettingsService.getPowerProfile().then(p => p && setProfile(p));
  }, []);

  const updateOffline = (v: boolean) => {
    setOffline(v);
    settingsService.setOfflineMode(v);
  };

  const updateGpu = (v: string) => {
    setGpu(v);
    settingsService.setGpuOverride(v);
  };

  const updateProfile = (p: string) => {
    setProfile(p);
    systemSettingsService.setPowerProfile(p);
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
          onChange={e => updateProfile(e.target.value)}
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
        {stats && (
          <div className="mt-2">
            <div className="h-2 bg-white/20 rounded">
              <div
                className="h-2 bg-blue-500 rounded"
                style={{ width: `${((stats.total - stats.free) / stats.total) * 100}%` }}
              />
            </div>
            <div className="text-xs mt-1">
              {Math.round(stats.free / 1e6)} / {Math.round(stats.total / 1e6)} MB free
            </div>
          </div>
        )}
      </div>
      {battery && (
        <div className="text-sm">
          <div className="font-semibold mb-1">Battery</div>
          <div className="h-2 bg-white/20 rounded">
            <div
              className="h-2 bg-green-500 rounded"
              style={{ width: `${battery.level * 100}%` }}
            />
          </div>
          <div className="text-xs mt-1">
            {Math.round(battery.level * 100)}% {battery.charging ? 'Charging' : 'Discharging'}
          </div>
        </div>
      )}
      <MemorySettings />
    </GlassCard>
  );
};

export default SystemSettingsView;
