import React from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Cog } from 'lucide-react';

export const GeneralSettings: React.FC = () => (
  <GlassCard className="h-full flex flex-col gap-4">
    <div className="flex items-center mb-4">
      <Cog size={24} className="text-cyan-300 mr-3" />
      <h1 className="text-xl sm:text-2xl font-bold">General Settings</h1>
    </div>
    <p className="text-sm">Placeholder for date, time, and regional options.</p>
  </GlassCard>
);

export default GeneralSettings;
