export interface PciDevice {
  bus: number;
  slot: number;
  func: number;
  vendor_id: number;
  device_id: number;
  class_code: number;
  subclass: number;
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
export let pciDevices: PciDevice[] = [];
export let moduleLoad = (path: string): Module | null => null;
export let moduleUnload = (m: Module): void => {};
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

function handle_new_device(dev: PciDevice) {
  const rec: Record = { dev, driver: drivers[0], present: true } as any;
  for (const drv of drivers) {
    if (!drv.match || drv.match(dev)) {
      drv.init?.(dev);
      rec.driver = drv;
      records.push(rec);
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
