import React, { useState } from 'react';
import { Phone, Bluetooth } from 'lucide-react';
import { usePhoneBridge } from '../../hooks/usePhoneBridge';

export const PhoneStatusWidget: React.FC = () => {
  const { status, connect, disconnect } = usePhoneBridge();
  const [address, setAddress] = useState('');

  const toggle = () => {
    if (status.connected) {
      disconnect();
    } else if (address) {
      connect(address);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-black/10 rounded-lg">
      <div className="flex items-center gap-2">
        <Phone size={20} className="text-green-400" />
        <span className="text-sm text-white/80">
          {status.connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!status.connected && (
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
          {status.connected ? 'Disconnect' : 'Connect'}
        </button>
        <Bluetooth size={20} className="text-blue-400 ml-1" />
      </div>
    </div>
  );
};
