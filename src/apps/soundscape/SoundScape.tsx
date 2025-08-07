import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { soundScapeService } from '../../../services/soundScapeService';
import { moodMixService } from '../../../services/moodMixService';
import { liveInsightsService, AudioInsight } from '../../../services/liveInsightsService';
import { soundAnalyzer, calculateEqForNoise, EQSettings } from '../../../services/soundAnalyzer';

interface Track {
  id: number;
  title: string;
  artist: string;
}

export const SoundScape: React.FC = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [eq, setEq] = useState<EQSettings>({ low: 0, mid: 0, high: 0 });
  const [insights, setInsights] = useState<AudioInsight | null>(null);
  const [playlists, setPlaylists] = useState<Record<string, Track[]>>({});

  useEffect(() => {
    let cancelled = false;
    soundScapeService.getTracks().then(setTracks);

    const unsub = liveInsightsService.subscribe(i => {
      if (!cancelled) setInsights(i);
    });

    const updateEq = async () => {
      const level = await soundAnalyzer.getNoiseLevel();
      if (!cancelled) {
        setEq(calculateEqForNoise(level));
        setTimeout(updateEq, 5000);
      }
    };
    updateEq();

    return () => {
      cancelled = true;
      unsub();
    };
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
        {insights && (
          <div className="text-xs mt-1">Tempo: {insights.tempo} / Energy: {insights.energy}</div>
        )}
        <button
          className="mt-2 p-1 bg-blue-500 text-white rounded"
          onClick={async () => {
            const res = await moodMixService.categorizeTracks();
            const grouped: Record<string, Track[]> = {};
            res.forEach(t => {
              grouped[t.mood] = [...(grouped[t.mood] || []), t];
            });
            setPlaylists(grouped);
          }}
        >
          Load Mood Mix
        </button>
        {Object.entries(playlists).map(([mood, list]) => (
          <div key={mood} className="mt-2">
            <h2 className="font-semibold text-sm capitalize">{mood}</h2>
            <ul className="text-sm space-y-1">
              {list.map(t => (
                <li key={t.id}>{t.title} - {t.artist}</li>
              ))}
            </ul>
          </div>
        ))}
      </AppPanel>
  );
};

export default SoundScape;
