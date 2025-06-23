import React from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Palette } from 'lucide-react';

export const PersonalizationSettings: React.FC = () => (
  <GlassCard className="h-full flex flex-col gap-4">
    <div className="flex items-center mb-4">
      <Palette size={24} className="text-cyan-300 mr-3" />
      <h1 className="text-xl sm:text-2xl font-bold">Personalization</h1>
    </div>
    <p className="text-sm">Placeholder for themes and wallpaper preferences.</p>
  </GlassCard>
);

export default PersonalizationSettings;
