import React from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Boxes } from 'lucide-react';

export const ApplicationSettings: React.FC = () => (
  <GlassCard className="h-full flex flex-col gap-4">
    <div className="flex items-center mb-4">
      <Boxes size={24} className="text-cyan-300 mr-3" />
      <h1 className="text-xl sm:text-2xl font-bold">Applications</h1>
    </div>
    <p className="text-sm">Placeholder for default apps and permissions.</p>
  </GlassCard>
);

export default ApplicationSettings;
