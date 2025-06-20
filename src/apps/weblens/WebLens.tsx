import React, { useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { weblensResearchService, FactCheckResult } from '../../services/weblensResearchService';

export const WebLens: React.FC = () => {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [facts, setFacts] = useState<FactCheckResult[]>([]);

  const fetchSummary = async () => {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/weblens/summarize?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      setSummary(data.summary);

      try {
        const pageRes = await fetch(url);
        const pageText = await pageRes.text();
        const checks = await weblensResearchService.factCheck(pageText);
        setFacts(checks);
      } catch {
        setFacts([]);
      }
    } catch {
      setSummary('Error fetching summary');
      setFacts([]);
    }
    setLoading(false);
  };

  return (
    <AppPanel>
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
      {facts.length > 0 && (
        <ul className="mt-2 text-sm space-y-1">
          {facts.map((f, i) => (
            <li key={i} className="border-b border-white/10 pb-1">
              <div>{f.text}</div>
              <div className="text-xs text-gray-400">
                {f.source} – {(f.confidence * 100).toFixed(0)}%
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppPanel>
  );
};

export default WebLens;
