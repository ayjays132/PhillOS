import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
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
    <AppPanel>
        <h1 className="text-3xl font-bold mb-4">SoundScape</h1>
        <ul className="text-sm space-y-1 overflow-auto">
          {tracks.map(t => (
            <li key={t.id}>{t.title} - {t.artist}</li>
          ))}
        </ul>
      </AppPanel>
  );
};

export default SoundScape;
