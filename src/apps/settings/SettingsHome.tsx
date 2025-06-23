import React from 'react';
import { GlassCard } from '../../components/GlassCard';
import { Link } from 'react-router-dom';
import {
  Cog,
  Palette,
  Wifi,
  Shield,
  Boxes,
  Cpu,
  Bot
} from 'lucide-react';

const categories = [
  { id: 'general', name: 'General', icon: Cog },
  { id: 'personalization', name: 'Personalization', icon: Palette },
  { id: 'network', name: 'Network & Connectivity', icon: Wifi },
  { id: 'privacy', name: 'Privacy & Security', icon: Shield },
  { id: 'applications', name: 'Applications', icon: Boxes },
  { id: 'system', name: 'System', icon: Cpu },
  { id: 'conversational', name: 'Conversational Mode', icon: Bot }
];

export const SettingsHome: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map(cat => {
        const Icon = cat.icon;
        return (
          <Link key={cat.id} to={`/settings/${cat.id}`}>
            <GlassCard className="flex items-center gap-3">
              <Icon size={24} className="text-cyan-300" />
              <span className="text-base font-semibold">{cat.name}</span>
            </GlassCard>
          </Link>
        );
      })}
    </div>
  );
};

export default SettingsHome;
