import React, { useState } from 'react';
import { agentService, AgentAction } from '../services/agentService';
import { useNavigate } from 'react-router-dom';
import { GlassCard } from './GlassCard';
import { useTheme } from '../contexts/ThemeContext';

export const AgentConsole: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<AgentAction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    setIsProcessing(true);
    const action = await agentService.processCommand(input);
    setOutput(action);
    setInput('');
    setIsProcessing(false);
    if (action?.action === 'open_app' && typeof action.parameters?.app === 'string') {
      navigate(`/${action.parameters.app}`);
    }
  };

  return (
    <GlassCard className="flex flex-col h-full !p-0">
      <div className="flex-grow p-4 overflow-y-auto">
        {output ? (
          <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(output, null, 2)}</pre>
        ) : (
          <p className="text-sm text-white/70">Enter a request for the PhillOS Agent.</p>
        )}
      </div>
      <form
        onSubmit={handleSubmit}
        className={`p-3 border-t ${isDark ? 'border-white/10 bg-black/10' : 'border-black/10 bg-white/10'} flex gap-2`}
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className={`flex-grow p-2 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-black/20'} rounded-lg text-sm focus:outline-none`}
          placeholder="Ask the Agent..."
        />
        <button
          type="submit"
          disabled={isProcessing}
          className={`px-4 py-2 ${isDark ? 'bg-purple-600/80 hover:bg-purple-500/80' : 'bg-indigo-600 hover:bg-indigo-500'} rounded-lg disabled:opacity-50`}
        >
          Run
        </button>
      </form>
    </GlassCard>
  );
};
