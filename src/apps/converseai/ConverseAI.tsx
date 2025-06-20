import React, { useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';

interface Msg { role: 'user' | 'ai'; text: string; }

export const ConverseAI: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toneMatch, setToneMatch] = useState(false);

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
        body: JSON.stringify({ message: userMsg.text, toneMatch }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', text: data.reply || 'No reply' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error contacting AI' }]);
    }
    setLoading(false);
  };

  return (
    <AppPanel>
      <div className="flex-grow overflow-auto space-y-2 mb-2 p-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right text-blue-300' : 'text-left text-purple-300'}`}>{m.text}</div>
        ))}
      </div>
      <div className="flex gap-2 p-2 border-t border-white/10">
        <label className="flex items-center gap-1 text-xs text-white/70">
          <input
            type="checkbox"
            checked={toneMatch}
            onChange={e => setToneMatch(e.target.checked)}
          />
          ToneMatch
        </label>
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
    </AppPanel>
  );
};

export default ConverseAI;
