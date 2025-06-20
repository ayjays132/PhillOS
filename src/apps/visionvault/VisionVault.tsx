import React, { useEffect, useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { visionVaultService } from '../../services/visionVaultService';

export const VisionVault: React.FC = () => {
  const [images, setImages] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  useEffect(() => {
    visionVaultService.getImages().then(setImages);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) { setResults([]); return; }
    const res = await visionVaultService.search(query.trim());
    setResults(res);
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
        </form>
        <div className="grid grid-cols-2 gap-2 overflow-auto">
          {display.map((src, i) => (
            <img key={i} src={src} alt={`img-${i}`} className="rounded" />
          ))}
        </div>
    </AppPanel>
  );
};

export default VisionVault;
