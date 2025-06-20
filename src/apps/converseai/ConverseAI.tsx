import React, { useState } from 'react';
import { GlassCard } from '../../components/GlassCard';

interface Msg { role: 'user' | 'ai'; text: string; }

export const ConverseAI: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Msg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/converseai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || 'No reply' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error contacting AI' }]);
    }
    setLoading(false);
  };

  return (
    <GlassCard className="flex flex-col h-full">
      <div className="flex-grow overflow-auto space-y-2 mb-2 p-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right text-blue-300' : 'text-left text-purple-300'}`}>{m.text}</div>
        ))}
      </div>
      <div className="flex gap-2 p-2 border-t border-white/10">
        <input
          className="flex-grow rounded border border-white/20 bg-transparent text-sm px-2 py-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Say something..."
        />
        <button onClick={send} disabled={loading} className="px-3 py-1 bg-blue-500 text-white rounded">
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </GlassCard>
  );
};

export default ConverseAI;
