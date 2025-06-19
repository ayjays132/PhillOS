import React, { useEffect, useState } from 'react';
import { Phone, Bluetooth } from 'lucide-react';
import { phoneService } from '../../services/phoneService';

export const PhoneStatusWidget: React.FC = () => {
  const [signal, setSignal] = useState(0);

  useEffect(() => {
    phoneService.getSignalStrength().then(setSignal);
  }, []);

  return (
    <div className="flex items-center justify-between p-3 bg-black/10 rounded-lg">
      <div className="flex items-center gap-2">
        <Phone size={20} className="text-green-400" />
        <span className="text-sm text-white/80">Signal: {signal}</span>
      </div>
      <Bluetooth size={20} className="text-blue-400" />
    </div>
  );
};
