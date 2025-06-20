import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import { soundScapeService } from '../../services/soundScapeService';

interface Track {
  id: number;
  title: string;
  artist: string;
}

export const SoundScape: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);

  useEffect(() => {
    soundScapeService.getTracks().then(setTracks);
  }, []);

  return (
    <div className="p-4 h-full">
      <GlassCard className="h-full flex flex-col">
        <h1 className="text-3xl font-bold mb-4">SoundScape</h1>
        <ul className="text-sm space-y-1 overflow-auto">
          {tracks.map(t => (
            <li key={t.id}>{t.title} - {t.artist}</li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
};

export default SoundScape;
