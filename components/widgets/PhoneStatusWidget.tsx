import React, { useState } from "react";
import { Phone, Bluetooth } from "lucide-react";
import { Link } from "react-router-dom";
import { usePhone } from "../../contexts/PhoneContext";

export const PhoneStatusWidget: React.FC = () => {
  const { status, connect, disconnect, lastAddress } = usePhone();
  const [address, setAddress] = useState(lastAddress);

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
          {status.connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {!status.connected && (
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="MAC"
            className="bg-transparent text-xs border border-white/20 rounded px-1 w-24"
          />
        )}
        <button
          onClick={toggle}
          className="text-xs px-2 py-1 bg-white/10 rounded text-white/80"
        >
          {status.connected ? "Disconnect" : "Connect"}
        </button>
        <Link to="/phone" className="ml-1 text-white/70 hover:text-white">
          <Bluetooth size={20} className="inline" />
        </Link>
      </div>
    </div>
  );
};
