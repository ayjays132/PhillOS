
import React, { useState } from 'react';
import { Search, Brain } from 'lucide-react';
import { WidgetCard } from '../layout/WidgetCard';

export const AIShadowSearchWidget: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setIsThinking(true);
    setResults([]); // Clear previous results
    // Simulate AI search
    setTimeout(() => {
      setResults([
        `Contextual result for "${searchTerm}"`,
        `Local file matching "${searchTerm}"`,
        `Web search snippet about "${searchTerm}"`,
      ]);
      setIsThinking(false);
    }, 1500);
  };

  return (
    <WidgetCard>
      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Semantic search across system & web..."
          className="flex-grow p-2 bg-white/5 border border-white/10 rounded-lg text-sm placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/80 transition-shadow duration-200 focus:shadow-[0_0_15px_rgba(56,189,248,0.3)]"
        />
        <button
          type="submit"
          className="p-2 bg-cyan-600/80 hover:bg-cyan-500/80 text-white rounded-lg disabled:opacity-50 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400/80"
          disabled={isThinking || !searchTerm.trim()}
        >
          {isThinking ? <Brain size={20} className="animate-pulse" /> : <Search size={20} />}
        </button>
      </form>
      <div className="flex-grow space-y-2 overflow-y-auto text-sm">
        {isThinking && (
          <div className="flex items-center justify-center text-white/60 p-4">
            <Brain size={24} className="animate-pulse mr-2" /> Searching...
          </div>
        )}
        {!isThinking && results.length === 0 && !searchTerm && (
            <p className="text-white/50 text-center p-4">Enter a query to start AI-powered search.</p>
        )}
        {!isThinking && results.length === 0 && searchTerm && (
            <p className="text-white/50 text-center p-4">No results found for "{searchTerm}".</p>
        )}
        {results.map((result, index) => (
          <div key={index} className="p-2 bg-black/10 rounded-md hover:bg-black/20 transition-colors">
            {result}
          </div>
        ))}
      </div>
    </WidgetCard>
  );
};
