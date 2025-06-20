import { useEffect, useState } from 'react';

export type DeviceType = 'desktop' | 'mobile' | 'steamdeck' | 'vr';

export interface DeviceInfo {
  deviceType: DeviceType;
  orientation: 'portrait' | 'landscape';
  hasTouch: boolean;
  hasGamepad: boolean;
}

const MOBILE_UA_REGEX = /Mobi|Android|iPhone|iPad|iPod/i;
const STEAM_DECK_UA_REGEX = /Steam Deck/i;

export function useDeviceType(): DeviceInfo {
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
  );
  const [hasTouch, setHasTouch] = useState<boolean>(navigator.maxTouchPoints > 0);
  const [hasGamepad, setHasGamepad] = useState<boolean>(false);

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');
    };
    const updateGamepad = () => {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
      setHasGamepad(pads.some(p => p));
    };
    const updateTouch = () => {
      setHasTouch(navigator.maxTouchPoints > 0);
    };
    const updateDeviceType = () => {
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
        (navigator as any).xr.isSessionSupported('immersive-vr')
          .then((supported: boolean) => {
            if (supported) {
              setDeviceType('vr');
            } else {
              setDeviceType('desktop');
            }
          })
          .catch(() => setDeviceType('desktop'));
      } else {
        setDeviceType('desktop');
      }
    };

    const onResizeOrOrientation = () => {
      updateOrientation();
      updateDeviceType();
    };

    updateGamepad();
    updateOrientation();
    updateTouch();
    updateDeviceType();
    window.addEventListener('resize', onResizeOrOrientation);
    window.addEventListener('orientationchange', onResizeOrOrientation);
    window.addEventListener('gamepadconnected', updateGamepad);
    window.addEventListener('gamepaddisconnected', updateGamepad);
    window.addEventListener('pointerdown', updateTouch, true);
    return () => {
      window.removeEventListener('resize', onResizeOrOrientation);
      window.removeEventListener('orientationchange', onResizeOrOrientation);
      window.removeEventListener('gamepadconnected', updateGamepad);
      window.removeEventListener('gamepaddisconnected', updateGamepad);
      window.removeEventListener('pointerdown', updateTouch, true);
    };
  }, []);

  return { deviceType, orientation, hasTouch, hasGamepad };
}
