import React, { useEffect, useState } from 'react';
import { GlassCard } from '../../components/GlassCard';
import NetworkSetup from '../../components/NetworkSetup';
import { Wifi, Bluetooth } from 'lucide-react';
import { systemSettingsService } from '../../../services/systemSettingsService';
import { useDeviceType } from '../../hooks/useDeviceType';

export const NetworkSettingsView: React.FC = () => {
  const [devices, setDevices] = useState<{ mac: string; name: string }[]>([]);
  const [pairMac, setPairMac] = useState('');
  const [stats, setStats] = useState<{ name: string; rx: number; tx: number }[]>([]);
  const [tethering, setTethering] = useState(false);
  const { deviceType } = useDeviceType();

  useEffect(() => {
    fetchDevices();
    if (deviceType === 'mobile') {
      systemSettingsService.getNetworkStats().then(s => {
        if (s) setStats(s);
      });
      fetch('/api/network/tethering')
        .then(res => res.json())
        .then(d => setTethering(!!d.tethering))
        .catch(() => {});
    }
  }, [deviceType]);

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/bluetooth/devices');
      const data = await res.json();
      if (Array.isArray(data.devices)) setDevices(data.devices);
    } catch {}
  };

  const pair = async () => {
    if (!pairMac) return;
    await systemSettingsService.setPermission('bluetooth', true);
    await fetch('/api/bluetooth/pair', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac: pairMac }),
    });
    setPairMac('');
  };

  const toggleTethering = async () => {
    const next = !tethering;
    setTethering(next);
    await systemSettingsService.setTethering(next);
  };

  return (
    <GlassCard className="h-full flex flex-col gap-4">
      <div className="flex items-center mb-4">
        <Wifi size={24} className="text-cyan-300 mr-3" />
        <h1 className="text-xl sm:text-2xl font-bold">Network & Connectivity</h1>
      </div>
      <NetworkSetup />
      <div className="mt-4">
        <div className="flex items-center mb-2 gap-2">
          <Bluetooth size={20} />
          <span className="font-semibold text-sm">Bluetooth Devices</span>
        </div>
        <ul className="text-sm mb-2 pl-2 list-disc">
          {devices.map(d => (
            <li key={d.mac}>{d.name} ({d.mac})</li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={pairMac}
            onChange={e => setPairMac(e.target.value)}
            placeholder="MAC"
            className="flex-grow bg-transparent border border-white/20 rounded px-2 py-1 text-sm"
          />
          <button
            className="px-3 rounded bg-white/20 hover:bg-white/30 text-sm"
            onClick={pair}
          >
            Pair
          </button>
        </div>
      </div>
      {deviceType === 'mobile' && (
        <div className="mt-4 text-sm">
          <div className="mb-2 font-semibold">Connection Statistics</div>
          <ul className="mb-2 pl-2 list-disc">
            {stats.map(s => (
              <li key={s.name}>{s.name}: {s.rx} RX / {s.tx} TX</li>
            ))}
          </ul>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={tethering}
              onChange={toggleTethering}
            />
            <span>Tethering</span>
          </label>
        </div>
      )}
    </GlassCard>
  );
};

export default NetworkSettingsView;
