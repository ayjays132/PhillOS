import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { EventEmitter } from 'events';

beforeEach(() => {
  vi.resetModules();
  process.env.VITEST = '1';
});

function setupMocks(simSendResult = 0) {
  const ffiLib = {
    init_sim: vi.fn(),
    sim_read_iccid: vi.fn(() => 0),
    sim_modem_present: vi.fn(() => 1),
    sim_send_sms: vi.fn(() => simSendResult),
    init_bluetooth: vi.fn(),
    bluetooth_start_pairing: vi.fn(),
    bluetooth_is_up: vi.fn(() => 1),
  };
  vi.doMock('ffi-napi', () => ({ default: { Library: vi.fn(() => ffiLib) } }));

  class MockPort extends EventEmitter {
    isOpen = true;
    open(cb?: (err?: Error | null) => void) { cb && cb(null); }
    pipe() { return this; }
    write = vi.fn();
    on = EventEmitter.prototype.on;
    off = EventEmitter.prototype.off;
  }
  vi.doMock('serialport', () => ({ SerialPort: MockPort }));
  class Parser extends EventEmitter {}
  vi.doMock('@serialport/parser-readline', () => ({ ReadlineParser: Parser }));

  vi.doMock('child_process', () => ({
    spawn: vi.fn(() => {
      const child: any = new EventEmitter();
      child.stdout = new EventEmitter();
      child.stderr = new EventEmitter();
      setImmediate(() => child.emit('close', 0));
      return child;
    })
  }));

  return { ffiLib };
}

describe('phoneBridge server', () => {
  it('connects device and reports status', async () => {
    const { ffiLib } = setupMocks();
    const mod = await import('../../services/phoneBridge/server.js');
    const app = mod.default;

    const address = 'AA:BB:CC:DD:EE';
    const res = await request(app).post('/connect').send({ address });
    expect(res.body).toEqual({ connected: true });

    const status = await request(app).get('/status');
    expect(status.body.connected).toBe(true);
    expect(status.body.device).toBe(address);
    expect(status.body.modemPresent).toBe(true);
    expect(status.body.bluetoothUp).toBe(true);
  });

  it('sends sms and updates status', async () => {
    const { ffiLib } = setupMocks();
    const mod = await import('../../services/phoneBridge/server.js');
    const app = mod.default;

    const sms = await request(app).post('/sms').send({ to: '+1', body: 'hi' });
    expect(sms.body).toEqual({ success: true });
    expect(ffiLib.sim_send_sms).toHaveBeenCalled();

    const status = await request(app).get('/status');
    expect(status.body.smsStatus).toBe('sent');
  });
});
