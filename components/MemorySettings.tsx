import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { memoryService } from '../services/memoryService';
import { BrainCircuit, Trash2 } from 'lucide-react';

export const MemorySettings: React.FC = () => {
  const [limit, setLimit] = useState<number>(memoryService.getLimit());
  const [usage, setUsage] = useState<number>(memoryService.getUsage());

  useEffect(() => {
    setUsage(memoryService.getUsage());
  }, []);

  const applyLimit = () => {
    memoryService.setLimit(limit);
    setUsage(memoryService.getUsage());
  };

  const clearMessages = () => {
    memoryService.clearMessages();
    setUsage(0);
  };

  return (
    <GlassCard className="!shadow-2xl !shadow-blue-600/30 !border-white/15 flex flex-col gap-4 h-full">
      <div className="flex items-center mb-2">
        <BrainCircuit size={24} className="text-yellow-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Memory Settings</h1>
      </div>
      <div className="space-y-2 text-sm flex flex-col flex-grow">
        <label className="flex flex-col gap-1">
          <span>Conversation Memory Limit</span>
          <input
            type="number"
            min={1}
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            onBlur={applyLimit}
            className="bg-transparent border border-white/20 rounded px-2 py-1"
          />
        </label>
        <div className="flex items-center justify-between mt-2">
          <span className="text-white/80">{usage} / {limit} messages</span>
          <button
            onClick={clearMessages}
            className="p-2 bg-red-600/70 hover:bg-red-500/70 rounded flex items-center gap-1 text-sm"
          >
            <Trash2 size={16} /> Clear History
          </button>
        </div>
      </div>
    </GlassCard>
  );
};

export default MemorySettings;
