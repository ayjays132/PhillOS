import React, { useState } from 'react';
import { AppPanel } from '../../components/layout/AppPanel';
import { translationService } from '../../../services/translationService';

interface Msg { role: 'user' | 'ai'; text: string; }

export const ConverseAI: React.FC = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toneMatch, setToneMatch] = useState(false);
  const [digest, setDigest] = useState('');
  const [lang, setLang] = useState('en');

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
      let reply = data.reply || 'No reply';
      if (lang !== 'en') {
        reply = await translationService.translate(reply, lang);
      }
      setMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error contacting AI' }]);
    }
    setLoading(false);
  };

  const summarize = async () => {
    try {
      const res = await fetch('/api/converseai/digest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
      const data = await res.json();
      setDigest(data.digest || '');
    } catch {
      setDigest('Error');
    }
  };

  return (
    <AppPanel>
      <div className="flex-grow overflow-auto space-y-2 mb-2 p-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-sm ${m.role === 'user' ? 'text-right text-blue-300' : 'text-left text-purple-300'}`}>{m.text}</div>
        ))}
        {digest && <div className="text-xs text-green-300 mt-2">Digest: {digest}</div>}
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
        <select
          className="text-xs bg-transparent border border-white/20 rounded px-1"
          value={lang}
          onChange={e => setLang(e.target.value)}
        >
          <option value="en">EN</option>
          <option value="es">ES</option>
          <option value="fr">FR</option>
        </select>
        <input
          className="flex-grow rounded border border-white/20 bg-transparent text-sm px-2 py-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Say something..."
        />
        <button onClick={send} disabled={loading} className="px-3 py-1 bg-blue-500 text-white rounded">
          {loading ? '...' : 'Send'}
        </button>
        <button onClick={summarize} className="px-3 py-1 bg-purple-600 text-white rounded">
          Digest
        </button>
      </div>
    </AppPanel>
  );
};

export default ConverseAI;
