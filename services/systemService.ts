import { invoke } from '@tauri-apps/api/tauri';
import { agentOrchestrator } from './agentOrchestrator';

export interface SchedStats {
  taskCount: number;
  lastResidual: number;
}

export interface DeviceEvent {
  added: boolean;
  bus: number;
  slot: number;
  func: number;
  vendorId: number;
  deviceId: number;
  classCode: number;
  subclass: number;
}

class SystemService {
  async queryScheduler(): Promise<SchedStats> {
    return invoke<SchedStats>('query_scheduler');
  }

  async nextDeviceEvent(): Promise<DeviceEvent | null> {
    return invoke<DeviceEvent | null>('next_device_event');
  }
}

export const systemService = new SystemService();

agentOrchestrator.registerAction('system.query_scheduler', () => systemService.queryScheduler());
agentOrchestrator.registerAction('system.device_event', () => systemService.nextDeviceEvent());
