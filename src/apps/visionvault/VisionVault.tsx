import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { visionVaultService } from '../../services/visionVaultService';

export const VisionVault: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [arEnabled, setArEnabled] = useState(false);

  useEffect(() => {
    visionVaultService.getImages().then(setImages);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { setResults([]); return; }
    const res = await visionVaultService.search(query.trim());
    setResults(res);
  };

  const toggleAR = async () => {
    if (arEnabled) {
      visionVaultService.stopAR();
      setArEnabled(false);
    } else {
      await visionVaultService.startAR();
      setArEnabled(true);
    }
  };

  const display = results.length ? results : images;

  return (
    <AppPanel>
        <h1 className="text-3xl font-bold mb-4">VisionVault</h1>
        <form onSubmit={handleSearch} className="mb-2 space-x-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Image URL to search"
            className="px-2 py-1 rounded text-black"
          />
          <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">
            Search
          </button>
          <button type="button" onClick={toggleAR} className="px-2 py-1 bg-green-600 text-white rounded">
            {arEnabled ? 'Disable AR' : 'Enable AR'}
          </button>
        </form>
        <div className="grid grid-cols-2 gap-2 overflow-auto">
          {display.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt={`img-${i}`} className="rounded" />
              <button
                onClick={async () => {
                  const out = await visionVaultService.enhance(src);
                  setImages(imgs => imgs.map(s => (s === src ? out : s)));
                  setResults(res => res.map(s => (s === src ? out : s)));
                }}
                className="absolute bottom-1 right-1 bg-black/50 text-white px-1 text-xs rounded"
              >
                Enhance
              </button>
            </div>
          ))}
        </div>
    </AppPanel>
  );
};

export default VisionVault;
