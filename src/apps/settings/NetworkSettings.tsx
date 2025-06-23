import React from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Wifi } from 'lucide-react';

export const NetworkSettings: React.FC = () => (
  <GlassCard className="h-full flex flex-col gap-4">
    <div className="flex items-center mb-4">
      <Wifi size={24} className="text-cyan-300 mr-3" />
      <h1 className="text-xl sm:text-2xl font-bold">Network & Connectivity</h1>
    </div>
    <p className="text-sm">Placeholder for Wi-Fi and Bluetooth options.</p>
  </GlassCard>
);

export default NetworkSettings;
