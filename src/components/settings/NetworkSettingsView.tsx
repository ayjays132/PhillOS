import React from 'react';
import { GlassCard } from '../GlassCard';
import NetworkSetup from '../NetworkSetup';
import { Wifi } from 'lucide-react';

export const NetworkSettingsView: React.FC = () => (
  <GlassCard className="h-full flex flex-col gap-4">
    <div className="flex items-center mb-4">
      <Wifi size={24} className="text-cyan-300 mr-3" />
      <h1 className="text-xl sm:text-2xl font-bold">Network & Connectivity</h1>
    </div>
    <NetworkSetup />
  </GlassCard>
);

export default NetworkSettingsView;
