import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { mediaSphereService } from '../../services/mediaSphereService';

interface Item { id: number; title: string; }

export const MediaSphere: React.FC = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState('');

  useEffect(() => { mediaSphereService.getMedia().then(setItems); }, []);

  const analyze = async () => {
    if (selected == null) return;
    const r = await mediaSphereService.analyzeVideo(selected);
    setResult(r.result || '');
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
    </AppPanel>
  );
};

export default MediaSphere;
