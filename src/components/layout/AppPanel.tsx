import React from 'react';
import { GlassCard } from '../GlassCard';

interface AppPanelProps {
  children: React.ReactNode;
  className?: string;
}

export const AppPanel: React.FC<AppPanelProps> = ({ children, className = '' }) => (
  <div className="app-panel">
    <GlassCard className={`h-full flex flex-col ${className}`}>{children}</GlassCard>
  </div>
);

export default AppPanel;
