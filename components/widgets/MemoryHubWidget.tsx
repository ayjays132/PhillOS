import React from 'react';
import { Download, Trash2, List } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemoryHub } from '../../contexts/MemoryHubContext';

export const MemoryHubWidget: React.FC = () => {
  const { windows, clear } = useMemoryHub();

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(windows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memory-windows-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full space-y-2">
      <div className="flex items-center justify-between text-sm text-white/80">
        <span>{windows.length} windows</span>
        <div className="space-x-2">
          <button
            onClick={exportLogs}
            className="p-1.5 bg-blue-600/70 hover:bg-blue-500/70 rounded transition-colors"
            title="Export Logs"
          >
            <Download size={16} />
          </button>
          <button
            onClick={clear}
            className="p-1.5 bg-red-600/70 hover:bg-red-500/70 rounded transition-colors"
            title="Clear Logs"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent space-y-1 text-xs">
        {windows.length === 0 && (
          <p className="text-white/50 text-center">No memory windows available.</p>
        )}
        {windows
          .slice()
          .reverse()
          .map(w => (
            <div key={w.timestamp} className="p-1 bg-black/10 rounded">
              <div className="flex items-center mb-0.5">
                <List size={12} className="mr-1 text-white/60" />
                <span className="text-white/50">
                  {new Date(w.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="text-white/90 break-words">{w.content}</div>
            </div>
          ))}
      </div>
      <Link
        to="/memory-hub"
        className="block text-center p-1.5 bg-blue-600/70 hover:bg-blue-500/70 rounded text-xs"
      >
        Open Hub
      </Link>
    </div>
  );
};

