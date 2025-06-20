import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { pulseMonitorService } from '../../services/pulseMonitorService';

export const PulseMonitor: React.FC = () => {
  const [bpm, setBpm] = useState(0);

  useEffect(() => {
    const load = () => pulseMonitorService.getStatus().then(s => setBpm(s.bpm));
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="p-4 h-full">
      <GlassCard className="h-full flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-2">Pulse Monitor</h1>
        <p className="text-lg">{bpm} BPM</p>
      </GlassCard>
    </div>
  );
};

export default PulseMonitor;
