import React from 'react';
import { GlassCard } from '../GlassCard';

interface WidgetCardProps {
  children: React.ReactNode;
  className?: string;
}

export const WidgetCard: React.FC<WidgetCardProps> = ({ children, className = '' }) => (
  <GlassCard className={`widget-card ${className}`}>{children}</GlassCard>
);

export default WidgetCard;
