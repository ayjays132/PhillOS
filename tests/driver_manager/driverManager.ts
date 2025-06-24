export interface PciDevice {
  bus: number;
  slot: number;
  func: number;
  vendor_id: number;
  device_id: number;
  class_code: number;
  subclass: number;
}

export interface IDevice extends PciDevice {}

export interface IHotSwapListener {
  deviceAdded?(dev: IDevice): void;
  deviceRemoved?(dev: IDevice): void;
}

export interface IDriverManager {
  registerDriver(d: Driver): void;
  unregisterDriver(d: Driver): void;
  init(): void;
  rescan(): void;
  unload(bus: number, slot: number, func: number): void;
  poll(): void;
  addHotSwapListener(l: IHotSwapListener): void;
  removeHotSwapListener(l: IHotSwapListener): void;
}

export interface Driver {
  name: string;
  match?: (dev: PciDevice) => boolean;
  init?: (dev: PciDevice) => void;
}

export interface Module {
  driver: Driver;
}

type Record = {
  dev: PciDevice;
  driver: Driver;
  module?: Module;
  present: boolean;
};

let drivers: Driver[] = [];
let records: Record[] = [];
let listeners: IHotSwapListener[] = [];
export let pciDevices: PciDevice[] = [];
export let moduleLoad = (path: string): Module | null => null;
export let moduleUnload = (m: Module): void => {};
let activeGfx: any = null;
export function gpu_set_active_driver(dev: any) {
  activeGfx = dev;
}
export function gpu_get_active_driver() {
  return activeGfx;
}
export function setModuleLoad(fn: (path: string) => Module | null) {
  moduleLoad = fn;
}
export function setModuleUnload(fn: (m: Module) => void) {
  moduleUnload = fn;
}

export function driver_manager_register(d: Driver) {
  drivers.unshift(d);
}

export function driver_manager_unregister(d: Driver) {
  drivers = drivers.filter(dr => dr !== d);
}

export function driver_manager_unload(bus: number, slot: number, func: number) {
  records = records.filter(r => {
    if (r.dev.bus===bus && r.dev.slot===slot && r.dev.func===func) {
      if (r.module) moduleUnload(r.module);
      for (const lis of listeners) lis.deviceRemoved?.(r.dev);
      return false;
    }
    return true;
  });
}

export function driver_manager_add_listener(l: IHotSwapListener) {
  listeners.unshift(l);
}

export function driver_manager_remove_listener(l: IHotSwapListener) {
  listeners = listeners.filter(x => x !== l);
}

function handle_new_device(dev: PciDevice) {
  const rec: Record = { dev, driver: drivers[0], present: true } as any;
  for (const drv of drivers) {
    if (!drv.match || drv.match(dev)) {
      drv.init?.(dev);
      rec.driver = drv;
      records.push(rec);
      for (const lis of listeners) lis.deviceAdded?.(dev);
      return;
    }
  }
  const path = `/modules/${dev.vendor_id.toString(16).padStart(4,'0')}_${dev.device_id.toString(16).padStart(4,'0')}.ko`;
  const mod = moduleLoad(path);
  if (mod && (!mod.driver.match || mod.driver.match(dev))) {
    mod.driver.init?.(dev);
    rec.driver = mod.driver;
    rec.module = mod;
    records.push(rec);
    for (const lis of listeners) lis.deviceAdded?.(dev);
  }
}

function pci_scan_changes() {
  for (const rec of records) rec.present = false;
  for (const dev of pciDevices) {
    const r = records.find(r => r.dev.bus===dev.bus && r.dev.slot===dev.slot && r.dev.func===dev.func);
    if (r) {
      r.present = true;
    } else {
      handle_new_device(dev);
    }
  }
  records = records.filter(r => {
    if (!r.present) {
      if (r.module) moduleUnload(r.module);
      for (const lis of listeners) lis.deviceRemoved?.(r.dev);
      return false;
    }
    return true;
  });
}

export function driver_manager_init() {
  records = [];
  pci_scan_changes();
}

export function driver_manager_rescan() {
  pci_scan_changes();
}

export function driver_manager_poll() {
  pci_scan_changes();
}

export const driverManager: IDriverManager = {
  registerDriver: driver_manager_register,
  unregisterDriver: driver_manager_unregister,
  init: driver_manager_init,
  rescan: driver_manager_rescan,
  unload: driver_manager_unload,
  poll: driver_manager_poll,
  addHotSwapListener: driver_manager_add_listener,
  removeHotSwapListener: driver_manager_remove_listener,
};
