import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { mediaSphereService } from '../../services/mediaSphereService';

interface Item { id: number; title: string; }
interface Chapter { start: number; title: string; }

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const MediaSphere: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [duration, setDuration] = useState(0);

  useEffect(() => { mediaSphereService.getMedia().then(setItems); }, []);

  const analyze = async () => {
    if (selected == null) return;
    const r = await mediaSphereService.analyzeVideo(selected);
    setResult(r.result || '');
    const c = await mediaSphereService.getChapters(selected);
    setChapters(c.chapters || []);
    setDuration(c.duration || 0);
  };

  return (
    <AppPanel>
        <h1 className="text-3xl font-bold mb-4">MediaSphere</h1>
        <ul className="space-y-1 flex-grow overflow-auto mb-4 text-sm">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-2">
              <input type="radio" name="vid" onChange={() => setSelected(item.id)} />
              <span>{item.title}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <button onClick={analyze} className="px-2 py-1 text-xs rounded bg-blue-500 text-white">Analyze</button>
          {result && <span className="text-sm">{result}</span>}
        </div>
        {chapters.length > 0 && (
          <>
            <div className="relative h-2 bg-gray-600 rounded my-2">
              {chapters.map((c, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-red-500"
                  style={{ left: duration ? `${(c.start / duration) * 100}%` : '0%' }}
                />
              ))}
            </div>
            <ul className="text-xs space-y-1 mb-2">
              {chapters.map((c, i) => (
                <li key={i}>{formatTime(c.start)} - {c.title}</li>
              ))}
            </ul>
          </>
        )}
    </AppPanel>
  );
};

export default MediaSphere;
