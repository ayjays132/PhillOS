import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as dm from './driverManager';

const nvidiaInit = vi.fn();
const amdInit = vi.fn();
const intelInit = vi.fn();

const nvidiaDrv = { name: 'nvidia', match: (d: dm.PciDevice) => d.vendor_id === 0x10DE && d.class_code === 0x03, init: nvidiaInit };
const amdDrv = { name: 'amd', match: (d: dm.PciDevice) => d.vendor_id === 0x1002 && d.class_code === 0x03, init: amdInit };
const intelDrv = { name: 'intel', match: (d: dm.PciDevice) => d.vendor_id === 0x8086 && d.class_code === 0x03, init: intelInit };

describe('gpu driver selection', () => {
  beforeEach(() => {
    dm.pciDevices.length = 0;
    dm.setModuleLoad(vi.fn());
    dm.setModuleUnload(vi.fn());
    dm.driver_manager_unregister(nvidiaDrv as any);
    dm.driver_manager_unregister(amdDrv as any);
    dm.driver_manager_unregister(intelDrv as any);
  });

  it('selects nvidia driver for vendor 0x10DE', () => {
    dm.driver_manager_register(amdDrv);
    dm.driver_manager_register(intelDrv);
    dm.driver_manager_register(nvidiaDrv);
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x10DE, device_id:1, class_code:3, subclass:0 });
    dm.driver_manager_init();
    expect(nvidiaInit).toHaveBeenCalled();
    expect(amdInit).not.toHaveBeenCalled();
    expect(intelInit).not.toHaveBeenCalled();
  });

  it('selects amd driver for vendor 0x1002', () => {
    dm.driver_manager_register(nvidiaDrv);
    dm.driver_manager_register(intelDrv);
    dm.driver_manager_register(amdDrv);
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x1002, device_id:1, class_code:3, subclass:0 });
    dm.driver_manager_init();
    expect(amdInit).toHaveBeenCalled();
    expect(nvidiaInit).not.toHaveBeenCalled();
    expect(intelInit).not.toHaveBeenCalled();
  });

  it('selects intel driver for vendor 0x8086', () => {
    dm.driver_manager_register(nvidiaDrv);
    dm.driver_manager_register(amdDrv);
    dm.driver_manager_register(intelDrv);
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x8086, device_id:1, class_code:3, subclass:0 });
    dm.driver_manager_init();
    expect(intelInit).toHaveBeenCalled();
    expect(nvidiaInit).not.toHaveBeenCalled();
    expect(amdInit).not.toHaveBeenCalled();
  });
});
