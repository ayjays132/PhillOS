import { describe, it, beforeEach, expect, vi } from 'vitest';
import * as dm from './driverManager';

const nvidiaInit = vi.fn();
const amdInit = vi.fn();
const intelInit = vi.fn();

const nvidiaDrv = { name: 'nvidia', match: (d: dm.PciDevice) => d.vendor_id === 0x10DE && d.class_code === 0x03, init: nvidiaInit };
const amdDrv = { name: 'amd', match: (d: dm.PciDevice) => d.vendor_id === 0x1002 && d.class_code === 0x03, init: amdInit };
const intelDrv = { name: 'intel', match: (d: dm.PciDevice) => d.vendor_id === 0x8086 && d.class_code === 0x03, init: intelInit };

describe('pci rescan gpu detection', () => {
  beforeEach(() => {
    dm.pciDevices.length = 0;
    dm.setModuleLoad(vi.fn());
    dm.setModuleUnload(vi.fn());
    vi.resetAllMocks();
    dm.driver_manager_unregister(nvidiaDrv as any);
    dm.driver_manager_unregister(amdDrv as any);
    dm.driver_manager_unregister(intelDrv as any);
  });

  function setup() {
    dm.driver_manager_register(nvidiaDrv);
    dm.driver_manager_register(amdDrv);
    dm.driver_manager_register(intelDrv);
    dm.driver_manager_init();
  }

  it('detects nvidia gpu on rescan', () => {
    setup();
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x10DE, device_id:1, class_code:3, subclass:0 });
    dm.driver_manager_rescan();
    expect(nvidiaInit).toHaveBeenCalled();
  });

  it('detects amd gpu on rescan', () => {
    setup();
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x1002, device_id:1, class_code:3, subclass:0 });
    dm.driver_manager_rescan();
    expect(amdInit).toHaveBeenCalled();
  });

  it('detects intel gpu on rescan', () => {
    setup();
    dm.pciDevices.push({ bus:0, slot:0, func:0, vendor_id:0x8086, device_id:1, class_code:3, subclass:0 });
    dm.driver_manager_rescan();
    expect(intelInit).toHaveBeenCalled();
  });
});
