
import React from 'react';
import { Moon, Sun, Volume2, WifiOff, Settings2 } from 'lucide-react';
import { WidgetCard } from '../layout/WidgetCard';

const ActionButton: React.FC<{ icon: React.ElementType; label: string; onClick?: () => void; color?: string }> = ({ icon: Icon, label, onClick, color = 'text-white/80' }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 ease-out focus:outline-none focus:ring-1 focus:ring-cyan-400/80 aspect-square text-center group"
  >
    <Icon size={24} className={`${color} mb-1.5 group-hover:scale-110 transition-transform`} />
    <span className="text-xs text-white/70 group-hover:text-white/90">{label}</span>
  </button>
);

export const QuickActionsWidget: React.FC = () => {
  return (
    <WidgetCard className="grid grid-cols-3 gap-2 sm:gap-2.5">
      <ActionButton icon={Moon} label="Dark Mode" color="text-purple-300" />
      <ActionButton icon={Sun} label="Light Mode" color="text-yellow-300" />
      <ActionButton icon={Volume2} label="Volume" color="text-green-300" />
      <ActionButton icon={WifiOff} label="Airplane" color="text-blue-300" />
      <ActionButton icon={Settings2} label="All Settings" color="text-gray-300" />
      {/* Add more actions as needed */}
    </WidgetCard>
  );
};
