import React from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Cpu } from 'lucide-react';

export const SystemSettings: React.FC = () => (
  <GlassCard className="h-full flex flex-col gap-4">
    <div className="flex items-center mb-4">
      <Cpu size={24} className="text-cyan-300 mr-3" />
      <h1 className="text-xl sm:text-2xl font-bold">System Settings</h1>
    </div>
    <p className="text-sm">Placeholder for storage, battery, and developer options.</p>
  </GlassCard>
);

export default SystemSettings;
