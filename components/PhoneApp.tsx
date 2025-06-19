import React, { useState } from 'react';
import { GlassCard } from './GlassCard';
import { usePhone } from '../contexts/PhoneContext';
import { createQwenChatSession } from '../services/qwenService';

const PhoneApp: React.FC = () => {
  const { connected, connect, disconnect, sendSms, makeCall } = usePhone();
  const [address, setAddress] = useState('');
  const [smsTo, setSmsTo] = useState('');
  const [smsBody, setSmsBody] = useState('');
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const toggle = () => {
    if (connected) {
      disconnect();
    } else if (address) {
      connect(address);
    }
  };

  const sendSms = async () => {
    if (!smsTo || !smsBody) return;
    await sendSms(smsTo, smsBody);
    setSmsBody('');
  };

  const dial = async () => {
    if (!number) return;
    await makeCall(number);
  };

  const suggest = async () => {
    setLoading(true);
    try {
      const session = await createQwenChatSession();
      let text = '';
      for await (const chunk of session.sendMessageStream(
        `Compose a short SMS: ${smsBody || ''}`
      )) {
        text += chunk;
      }
      setSmsBody(text.trim());
    } catch (err) {
      console.error('Suggestion failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="!shadow-2xl !shadow-blue-600/30 !border-white/15 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!connected && (
            <input
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="MAC"
              className="bg-transparent text-xs border border-white/20 rounded px-1 w-24"
            />
          )}
          <button
            onClick={toggle}
            className="text-xs px-2 py-1 bg-white/10 rounded text-white/80"
          >
            {connected ? 'Disconnect' : 'Connect'}
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={smsTo}
            onChange={e => setSmsTo(e.target.value)}
            placeholder="To"
            className="bg-transparent text-sm border border-white/20 rounded px-2 flex-1"
          />
          <button onClick={suggest} className="text-xs px-2 py-1 bg-white/10 rounded text-white/80">
            {loading ? '...' : 'Suggest'}
          </button>
        </div>
        <textarea
          value={smsBody}
          onChange={e => setSmsBody(e.target.value)}
          placeholder="Message"
          className="bg-transparent text-sm border border-white/20 rounded px-2 py-1 w-full h-24"
        />
        <button
          onClick={sendSms}
          className="w-full text-xs px-2 py-1 bg-white/20 rounded text-white/80"
        >
          Send SMS
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <input
          value={number}
          onChange={e => setNumber(e.target.value)}
          placeholder="Number"
          className="bg-transparent text-sm border border-white/20 rounded px-2 w-full"
        />
        <button
          onClick={dial}
          className="w-full text-xs px-2 py-1 bg-white/20 rounded text-white/80"
        >
          Call
        </button>
      </div>
    </GlassCard>
  );
};

export default PhoneApp;
