import React, { useEffect, useState } from 'react';
import { GlassCard } from '../GlassCard';
import { Cpu } from 'lucide-react';
import MemorySettings from '../MemorySettings';
import { settingsService } from '../../../services/settingsService';
import { storageService } from '../../../services/storageService';

export const SystemSettingsView: React.FC = () => {
  const [offline, setOffline] = useState<boolean>(storageService.getOfflineMode() ?? false);
  const [gpu, setGpu] = useState<string>(storageService.getGpuOverride() || 'auto');

  useEffect(() => {
    settingsService.fetchOfflineMode().then(v => v !== null && setOffline(v));
    settingsService.fetchGpuOverride().then(v => v && setGpu(v));
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
      <MemorySettings />
    </GlassCard>
  );
};

export default SystemSettingsView;
