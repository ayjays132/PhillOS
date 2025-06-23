import React from 'react';
import { GlassCard } from '../GlassCard';
import { Cpu } from 'lucide-react';
import MemorySettings from '../MemorySettings';

export const SystemSettingsView: React.FC = () => (
  <GlassCard className="h-full flex flex-col gap-4">
    <div className="flex items-center mb-4">
      <Cpu size={24} className="text-cyan-300 mr-3" />
      <h1 className="text-xl sm:text-2xl font-bold">System Settings</h1>
    </div>
    <p className="text-sm">Placeholder for storage, battery, and developer options.</p>
    <MemorySettings />
  </GlassCard>
);

export default SystemSettingsView;
