import React, { useState } from 'react';
import { GlassCard } from '../GlassCard';
import { Boxes } from 'lucide-react';
import { systemSettingsService } from '../../services/systemSettingsService';

export const ApplicationsSettingsView: React.FC = () => {
  const [defaultBrowser, setDefaultBrowser] = useState('');
  const [uninstall, setUninstall] = useState('');

  const remove = async () => {
    if (!uninstall) return;
    await fetch('/api/apps/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: uninstall }),
    });
    setUninstall('');
  };

  return (
    <GlassCard className="h-full flex flex-col gap-4">
      <div className="flex items-center mb-4">
        <Boxes size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Applications</h1>
      </div>
      <label className="text-sm flex flex-col gap-1">
        <span>Default Browser</span>
        <input
          type="text"
          value={defaultBrowser}
          onChange={e => setDefaultBrowser(e.target.value)}
          onBlur={() => systemSettingsService.setPermission('browser', true)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        />
      </label>
      <div className="flex gap-2 items-end text-sm">
        <input
          type="text"
          value={uninstall}
          onChange={e => setUninstall(e.target.value)}
          placeholder="App ID"
          className="flex-grow bg-transparent border border-white/20 rounded px-2 py-1"
        />
        <button
          className="px-3 py-1 bg-red-600/60 rounded"
          onClick={remove}
        >
          Uninstall
        </button>
      </div>
    </GlassCard>
  );
};

export default ApplicationsSettingsView;
