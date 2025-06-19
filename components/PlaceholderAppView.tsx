
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface PlaceholderAppViewProps {
  appName: string;
  icon: LucideIcon;
  message?: string;
}

export const PlaceholderAppView: React.FC<PlaceholderAppViewProps> = ({ appName, icon: Icon, message }) => {
  return (
    <GlassCard className="!shadow-2xl !shadow-blue-600/30 !border-white/15 h-full flex flex-col items-center justify-center text-center">
      <Icon size={64} className="text-cyan-300 mb-6 opacity-70" />
      <h1 className="text-3xl font-bold mb-2">{appName}</h1>
      <p className="text-white/70 text-lg">
        {message || `The ${appName} application is under development.`}
      </p>
      <p className="text-white/50 mt-4 text-sm">
        This is a conceptual prototype of PhillOS.
      </p>
    </GlassCard>
  );
};
