import React, { useEffect, useState } from 'react';
import { GlassCard } from '../GlassCard';
import { storageService } from '../../services/storageService';
import { Phone } from 'lucide-react';

export const PhoneSettingsView: React.FC = () => {
  const [bluetoothAddress, setBluetoothAddress] = useState('');
  const [modemDevice, setModemDevice] = useState('');
  const [autoConnect, setAutoConnect] = useState(false);
  const [ringtone, setRingtone] = useState('');
  const [vibrate, setVibrate] = useState(false);

  useEffect(() => {
    const stored = storageService.getPhoneSettings();
    if (stored) {
      setBluetoothAddress(stored.bluetoothAddress || '');
      setModemDevice(stored.modemDevice || '');
      setAutoConnect(stored.autoConnect ?? false);
      setRingtone(stored.ringtone || '');
      setVibrate(stored.vibrate ?? false);
    }
  }, []);

  useEffect(() => {
    storageService.setPhoneSettings({
      bluetoothAddress,
      modemDevice,
      autoConnect,
      ringtone,
      vibrate,
    });
  }, [bluetoothAddress, modemDevice, autoConnect, ringtone, vibrate]);

  return (
    <GlassCard className="!shadow-2xl !shadow-blue-600/30 !border-white/15 h-full flex flex-col gap-4">
      <div className="flex items-center mb-4">
        <Phone size={24} className="text-green-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Phone Settings</h1>
      </div>
      <label className="text-sm flex flex-col gap-1">
        <span>Default MAC Address</span>
        <input
          type="text"
          value={bluetoothAddress}
          onChange={e => setBluetoothAddress(e.target.value)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        />
      </label>
      <label className="text-sm flex flex-col gap-1">
        <span>Modem Device Path</span>
        <input
          type="text"
          value={modemDevice}
          onChange={e => setModemDevice(e.target.value)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        />
      </label>
      <label className="text-sm flex flex-col gap-1">
        <span>Ringtone</span>
        <input
          type="text"
          value={ringtone}
          onChange={e => setRingtone(e.target.value)}
          className="bg-transparent border border-white/20 rounded px-2 py-1"
        />
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={vibrate}
          onChange={e => setVibrate(e.target.checked)}
        />
        <span>Vibrate on ring</span>
      </label>
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoConnect}
          onChange={e => setAutoConnect(e.target.checked)}
        />
        <span>Auto connect on startup</span>
      </label>
    </GlassCard>
  );
};

export default PhoneSettingsView;
