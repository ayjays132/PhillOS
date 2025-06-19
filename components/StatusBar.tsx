
import React, { useState, useEffect } from 'react';
import { Wifi, BatteryCharging, Cpu, Menu } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="h-12 px-4 flex items-center justify-between text-sm glass-card-style bg-white/10 !rounded-none !rounded-b-xl !shadow-lg !shadow-purple-900/30 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Menu size={20} className="text-white/70 hover:text-white cursor-pointer" />
        <span className="font-semibold">PhillOS</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <Cpu size={18} className="text-cyan-400 animate-pulse-slow" />
        <Wifi size={18} className="text-green-400" />
        <div className="flex items-center gap-1">
          <BatteryCharging size={18} className="text-yellow-300" />
          <span>92%</span>
        </div>
        <span>{formattedTime}</span>
      </div>
    </div>
  );
};
