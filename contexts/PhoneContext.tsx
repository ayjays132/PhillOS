import React, { createContext, useContext, useState, useCallback } from "react";
import { usePhoneBridge } from "../hooks/usePhoneBridge";
import { storageService } from "../services/storageService";

interface PhoneContextValue extends ReturnType<typeof usePhoneBridge> {
  /** Last successfully connected bluetooth address */
  lastAddress: string;
}
const PhoneContext = createContext<PhoneContextValue | undefined>(undefined);

export const PhoneProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const phone = usePhoneBridge();
  const [lastAddress, setLastAddress] = useState(() => {
    const stored = storageService.getPhoneSettings();
    return stored?.bluetoothAddress || "";
  });

  const connect = useCallback<PhoneContextValue["connect"]>(
    async (addr) => {
      await phone.connect(addr);
      setLastAddress(addr);
      const settings = storageService.getPhoneSettings() || {
        bluetoothAddress: "",
        modemDevice: "",
        autoConnect: false,
        ringtone: "",
        vibrate: false,
      };
      storageService.setPhoneSettings({ ...settings, bluetoothAddress: addr });
    },
    [phone],
  );

  return (
    <PhoneContext.Provider value={{ ...phone, connect, lastAddress }}>
      {children}
    </PhoneContext.Provider>
  );
};

export const usePhone = () => {
  const ctx = useContext(PhoneContext);
  if (!ctx) throw new Error("usePhone must be used within PhoneProvider");
  return ctx;
};
