import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePhoneBridge } from '../hooks/usePhoneBridge';
import { phoneService } from '../services/phoneService';

interface PhoneContextProps {
  connected: boolean;
  signalStrength: number;
  connect: (addr: string) => Promise<void>;
  disconnect: () => Promise<void>;
  sendSms: (to: string, body: string) => Promise<void>;
  makeCall: (number: string) => Promise<void>;
}

const PhoneContext = createContext<PhoneContextProps | undefined>(undefined);

export const PhoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, connect, disconnect, sendSms, makeCall } = usePhoneBridge();
  const [signalStrength, setSignalStrength] = useState(0);

  useEffect(() => {
    const fetchStrength = async () => {
      const strength = await phoneService.getSignalStrength();
      setSignalStrength(strength);
    };
    fetchStrength();
    const id = setInterval(fetchStrength, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <PhoneContext.Provider
      value={{
        connected: status.connected,
        signalStrength,
        connect,
        disconnect,
        sendSms,
        makeCall,
      }}
    >
      {children}
    </PhoneContext.Provider>
  );
};

export const usePhone = () => {
  const ctx = useContext(PhoneContext);
  if (!ctx) throw new Error('usePhone must be used within PhoneProvider');
  return ctx;
};
