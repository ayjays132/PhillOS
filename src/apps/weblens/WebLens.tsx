import React, { useState } from 'react';
import { GlassCard } from '../../components/GlassCard';

export const WebLens: React.FC = () => {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchSummary = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/weblens/summarize?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      setSummary('Error fetching summary');
    }
    setLoading(false);
  };

  return (
    <GlassCard className="flex flex-col h-full">
      <div className="flex gap-2 mb-2">
        <input
          className="flex-grow text-sm rounded border border-white/20 bg-transparent px-2 py-1"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="Enter URL"
        />
        <button onClick={fetchSummary} disabled={loading} className="px-3 py-1 bg-blue-500 text-white rounded">
          {loading ? '...' : 'Go'}
        </button>
      </div>
      <pre className="flex-grow overflow-auto text-sm whitespace-pre-wrap">{summary}</pre>
    </GlassCard>
  );
};

export default WebLens;
