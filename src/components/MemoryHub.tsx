import React, { useEffect, useState } from 'react';
import { GlassCard } from './GlassCard';
import { memoryService } from '../../services/memoryService';
import { Trash2, Brain } from 'lucide-react';
import { ChatMessage } from '../types';

export const MemoryHub: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [limit, setLimit] = useState<number>(memoryService.getLimit());
  const [usage, setUsage] = useState<number>(memoryService.getUsage());
  const [trainingRunning, setTrainingRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadMessages = () => {
    setMessages(memoryService.getMessages());
    setUsage(memoryService.getUsage());
    setLimit(memoryService.getLimit());
  };

  const fetchTrainingStatus = async () => {
    try {
      const res = await fetch('/training/status');
      if (res.ok) {
        const data = await res.json();
        setTrainingRunning(!!data.running);
      }
    } catch {
      // ignore network errors
    }
  };

  useEffect(() => {
    loadMessages();
    fetchTrainingStatus();
  }, []);

  const purgeMemory = () => {
    memoryService.clearMessages();
    loadMessages();
  };

  const startTraining = async () => {
    setLoading(true);
    try {
      await fetch('/training/start', { method: 'POST' });
      setTrainingRunning(true);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="!shadow-2xl !shadow-blue-600/30 !border-white/15 flex flex-col gap-4 h-full">
      <div className="flex items-center mb-2">
        <Brain size={24} className="text-yellow-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Memory Hub</h1>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/80">{usage} / {limit} messages</span>
        <button
          onClick={purgeMemory}
          className="p-2 bg-red-600/70 hover:bg-red-500/70 rounded flex items-center gap-1 text-sm"
        >
          <Trash2 size={16} /> Purge
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-1 space-y-2 text-sm scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && (
          <p className="text-white/50 text-center">No conversation history.</p>
        )}
        {messages.slice().reverse().map(m => (
          <div key={m.id} className="p-2 bg-black/10 rounded">
            <div className="flex items-center mb-0.5 text-white/50 text-xs">
              <span className="mr-2">{new Date(m.timestamp).toLocaleString()}</span>
              <span>{m.role}</span>
            </div>
            <div className="text-white/90 break-words">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="mt-2">
        <button
          onClick={startTraining}
          disabled={loading || trainingRunning}
          className={`w-full flex items-center justify-center gap-2 p-2 text-sm rounded-md transition-colors ${trainingRunning ? 'bg-green-800/70' : 'bg-green-600/70 hover:bg-green-500/70'}`}
        >
          {trainingRunning ? 'Training Running' : 'Start Training'}
        </button>
      </div>
    </GlassCard>
  );
};

export default MemoryHub;
