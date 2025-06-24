import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { mediaSphereService } from '../services/mediaSphereService';
import { soundScapeService } from '../services/soundScapeService';

interface Playing {
  title: string;
}

export const LockScreenMedia: React.FC = () => {
  const [playing, setPlaying] = useState<Playing | null>(null);
  const [state, setState] = useState<'playing' | 'paused' | 'stopped'>('paused');
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('lockscreen_media_hidden') === '1') {
      setHidden(true);
    }
  }, []);

  useEffect(() => {
    if (hidden) return;
    let cancelled = false;
    const load = async () => {
      try {
        const media = await mediaSphereService.getMedia();
        if (!cancelled && media.length) {
          setPlaying({ title: media[0].title });
          return;
        }
      } catch {}
      try {
        const tracks = await soundScapeService.getTracks();
        if (!cancelled && tracks.length) {
          const t = tracks[0];
          setPlaying({ title: `${t.title} - ${t.artist}` });
        }
      } catch {}
    };
    load();
    return () => { cancelled = true; };
  }, [hidden]);

  const toggle = () => {
    setState(prev => (prev === 'playing' ? 'paused' : 'playing'));
  };

  const stop = () => {
    setState('stopped');
  };

  const hide = () => {
    sessionStorage.setItem('lockscreen_media_hidden', '1');
    setHidden(true);
  };

  if (hidden || !playing) return null;

  return (
    <GlassCard className="mt-4 w-60 text-sm text-center">
      <div className="font-semibold mb-2">Now Playing</div>
      <div className="mb-2">{playing.title}</div>
      <div className="space-x-2">
        <button
          className="px-2 py-1 rounded bg-white/20 hover:bg-white/30"
          onClick={toggle}
        >
          {state === 'playing' ? 'Pause' : 'Play'}
        </button>
        <button
          className="px-2 py-1 rounded bg-white/20 hover:bg-white/30"
          onClick={stop}
        >
          Stop
        </button>
      </div>
      <button className="mt-3 text-xs underline" onClick={hide}>
        Hide
      </button>
      <div className="text-xs mt-1">Unlock to continue</div>
    </GlassCard>
  );
};

export default LockScreenMedia;
