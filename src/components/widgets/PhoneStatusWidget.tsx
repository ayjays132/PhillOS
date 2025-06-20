import React, { useState } from "react";
import { Phone, Bluetooth } from "lucide-react";
import { Link } from "react-router-dom";
import { usePhone } from "../../contexts/PhoneContext";
import { useTheme } from "../../contexts/ThemeContext";
import { WidgetCard } from '../layout/WidgetCard';

export const PhoneStatusWidget: React.FC = () => {
  const { status, connect, disconnect, lastAddress } = usePhone();
  const [address, setAddress] = useState(lastAddress);
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const toggle = () => {
    if (status.connected) {
      disconnect();
    } else if (address) {
      connect(address);
    }
  };

  return (
    <WidgetCard className="flex-row items-center justify-between">
      <div className="flex items-center gap-2">
        <Phone size={20} className="text-green-400" />
        <span className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-800/80'}`}>
          {status.connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!status.connected && (
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="MAC"
            className={`bg-transparent text-xs rounded px-1 w-24 border ${isDark ? 'border-white/20 text-white' : 'border-black/30 text-gray-900'}`}
          />
        )}
        <button
          onClick={toggle}
          className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-white/10 text-white/80' : 'bg-black/10 text-gray-800'}`}
        >
          {status.connected ? "Disconnect" : "Connect"}
        </button>
        <Link
          to="/phone"
          className={`ml-1 ${isDark ? 'text-white/70 hover:text-white' : 'text-gray-700 hover:text-gray-900'}`}
        >
          <Bluetooth size={20} className="inline" />
        </Link>
      </div>
    </WidgetCard>
  );
};
