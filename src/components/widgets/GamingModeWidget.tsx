
import React, { useState } from 'react';
import { Gamepad2, Zap, ShieldCheck } from 'lucide-react';

export const GamingModeWidget: React.FC = () => {
  const [isGamingMode, setIsGamingMode] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full p-2">
      <Gamepad2 size={36} className={`mb-3 transition-colors ${isGamingMode ? 'text-pink-400 animate-pulse-slow' : 'text-white/60'}`} />
      <p className={`text-lg font-semibold mb-1 ${isGamingMode ? 'text-pink-300' : 'text-white/80'}`}>
        Gaming Mode
      </p>
      <p className="text-xs text-white/60 mb-3 text-center">
        {isGamingMode ? 'Optimized for peak performance!' : 'Boost performance for your games.'}
      </p>
      <button
        onClick={() => setIsGamingMode(!isGamingMode)}
        className={`w-full p-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out focus:outline-none focus:ring-2  ${
          isGamingMode
            ? 'bg-pink-500/80 hover:bg-pink-600/80 text-white focus:ring-pink-300'
            : 'bg-white/10 hover:bg-white/20 text-white/80 focus:ring-cyan-400'
        }`}
      >
        {isGamingMode ? 'Disable Gaming Mode' : 'Enable Gaming Mode'}
      </button>
      {isGamingMode && (
        <div className="mt-3 text-xs space-y-1 text-white/70 w-full">
          <div className="flex items-center"><Zap size={14} className="mr-1.5 text-yellow-400"/> Performance Boost: Active</div>
          <div className="flex items-center"><ShieldCheck size={14} className="mr-1.5 text-green-400"/> Distraction Free: Enabled</div>
        </div>
      )}
    </div>
  );
};
