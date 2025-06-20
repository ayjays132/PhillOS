import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dm from './driverManager';

describe('driver_manager', () => {
  beforeEach(() => {
    dm.pciDevices.length = 0;
    dm.setModuleLoad(vi.fn());
    dm.setModuleUnload(vi.fn());
  });

  it('registers driver and initializes on scan', () => {
    const init = vi.fn();
    const drv = { name: 'test', match: (d: any) => d.vendor_id === 0x1111, init };
    dm.driver_manager_register(drv);
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x1111, device_id:1, class_code:3, subclass:0 });
    dm.driver_manager_init();
    expect(init).toHaveBeenCalled();
    dm.driver_manager_unregister(drv);
  });

  it('loads module when no driver matches', () => {
    const modInit = vi.fn();
    dm.setModuleLoad(vi.fn(() => ({ driver: { name:'mod', init: modInit } })) as any);
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x1234, device_id:0x5678, class_code:2, subclass:0 });
    dm.driver_manager_init();
    expect((dm as any).moduleLoad).toHaveBeenCalledWith('/modules/1234_5678.ko');
    expect(modInit).toHaveBeenCalled();
  });

  it('unloads module on device removal', () => {
    dm.setModuleLoad(vi.fn(() => ({ driver: { name:'mod' } })) as any);
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x1234, device_id:1, class_code:2, subclass:0 });
    dm.driver_manager_init();
    expect((dm.moduleLoad as any).mock.calls.length).toBe(1);
    dm.pciDevices.length = 0; // device removed
    dm.driver_manager_poll();
    expect(dm.moduleUnload).toHaveBeenCalled();
  });
});
