import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { soundScapeService } from '../../services/soundScapeService';
import { soundAnalyzer, calculateEqForNoise, EQSettings } from '../../services/soundAnalyzer';

interface Track {
  id: number;
  title: string;
  artist: string;
}

export const SoundScape: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [eq, setEq] = useState<EQSettings>({ low: 0, mid: 0, high: 0 });

  useEffect(() => {
    soundScapeService.getTracks().then(setTracks);
    soundAnalyzer.getNoiseLevel().then(level => setEq(calculateEqForNoise(level)));
  }, []);

  return (
    <AppPanel>
        <h1 className="text-3xl font-bold mb-4">SoundScape</h1>
        <ul className="text-sm space-y-1 overflow-auto">
          {tracks.map(t => (
            <li key={t.id}>{t.title} - {t.artist}</li>
          ))}
        </ul>
        <div className="text-xs mt-2">EQ: low {eq.low} / mid {eq.mid} / high {eq.high}</div>
      </AppPanel>
  );
};

export default SoundScape;
