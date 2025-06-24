
import React from 'react';
import { Cpu, Zap, Thermometer, HardDrive } from 'lucide-react';
import { WidgetCard } from '../layout/WidgetCard';

const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string; color: string; pulsating?: boolean }> = ({ icon: Icon, label, value, color, pulsating }) => (
  <div className="flex items-center justify-between p-2.5 bg-black/10 rounded-lg">
    <div className="flex items-center">
      <Icon size={18} className={`${color} ${pulsating ? 'animate-pulse-slow' : ''} mr-2`} />
      <span className="text-sm text-white/80">{label}</span>
    </div>
    <span className={`text-sm font-medium ${color}`}>{value}</span>
  </div>
);

export const SystemHealthWidget: React.FC = () => {
  return (
    <WidgetCard className="space-y-2.5">
      <StatItem icon={Cpu} label="CPU Usage" value="35%" color="text-cyan-400" pulsating />
      <StatItem icon={Zap} label="RAM Usage" value="6.8 / 16 GB" color="text-purple-400" />
      <StatItem icon={HardDrive} label="Storage" value="250 GB Free" color="text-green-400" />
      <StatItem icon={Thermometer} label="Core Temp" value="45°C" color="text-orange-400" />
       <button className="w-full mt-2 p-2 text-sm bg-blue-600/70 hover:bg-blue-500/70 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300">
        Optimize System
      </button>
    </WidgetCard>
  );
};
