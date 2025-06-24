import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as dm from './driverManager';

describe('gfx device initialization', () => {
  beforeEach(() => {
    dm.pciDevices.length = 0;
    dm.setModuleLoad(vi.fn());
    dm.setModuleUnload(vi.fn());
    dm.gpu_set_active_driver(null);
  });

  it('records gfx device provided by driver', () => {
    const gfx = {};
    const drv = {
      name: 'gfx',
      match: () => true,
      init: () => dm.gpu_set_active_driver(gfx)
    };
    dm.driver_manager_register(drv);
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x1111, device_id:1, class_code:3, subclass:0 });
    dm.driver_manager_init();
    expect(dm.gpu_get_active_driver()).toBe(gfx);
    dm.driver_manager_unregister(drv as any);
  });
});
