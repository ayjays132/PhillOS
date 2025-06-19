import { useEffect, useState } from 'react';

export type DeviceType = 'desktop' | 'mobile' | 'steamdeck' | 'vr';

const MOBILE_UA_REGEX = /Mobi|Android|iPhone|iPad|iPod/i;
const STEAM_DECK_UA_REGEX = /Steam Deck/i;

export function useDeviceType(): { deviceType: DeviceType } {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');

  useEffect(() => {
    const ua = navigator.userAgent;
    if (STEAM_DECK_UA_REGEX.test(ua)) {
      setDeviceType('steamdeck');
      return;
    }
    if (MOBILE_UA_REGEX.test(ua) || window.innerWidth < 768) {
      setDeviceType('mobile');
      return;
    }
    if ((navigator as any).xr && typeof (navigator as any).xr.isSessionSupported === 'function') {
      (navigator as any).xr.isSessionSupported('immersive-vr').then((supported: boolean) => {
        if (supported) {
          setDeviceType('vr');
        }
      }).catch(() => {
        setDeviceType('desktop');
      });
    }
  }, []);

  return { deviceType };
}
