
import React, { useState, useEffect } from 'react';
import {
  Wifi,
  BatteryCharging,
  Cpu,
  Menu,
  Phone,
  PhoneOff,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  SignalZero,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { usePhone } from '../contexts/PhoneContext';

export const StatusBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000 * 60); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const { theme } = useTheme();
  const { connected, signalStrength } = usePhone();
  const isDark = theme === 'dark';

  let SignalIcon = SignalZero;
  if (signalStrength > 75) SignalIcon = SignalHigh;
  else if (signalStrength > 50) SignalIcon = SignalMedium;
  else if (signalStrength > 25) SignalIcon = SignalLow;
  else if (signalStrength > 0) SignalIcon = Signal;

  return (
    <div
      className={`h-12 px-4 flex items-center justify-between text-sm glass-card-style ${isDark ? 'bg-white/10 !shadow-purple-900/30' : 'bg-black/10 !shadow-gray-500/30 text-gray-900'} !rounded-none !rounded-b-xl !shadow-lg sticky top-0 z-50`}
    >
      <div className="flex items-center gap-2">
        <Menu size={20} className="text-white/70 hover:text-white cursor-pointer" />
        <span className="font-semibold">PhillOS</span>
      </div>
      <div className="flex items-center gap-3 sm:gap-4">
        <Cpu size={18} className="text-cyan-400 animate-pulse-slow" />
        <Wifi size={18} className="text-green-400" />
        {connected ? (
          <SignalIcon size={18} className="text-green-400" />
        ) : (
          <PhoneOff size={18} className="text-red-400" />
        )}
        <div className="flex items-center gap-1">
          <BatteryCharging size={18} className="text-yellow-300" />
          <span>92%</span>
        </div>
        <span>{formattedTime}</span>
      </div>
    </div>
  );
};
