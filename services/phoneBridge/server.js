import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffi from 'ffi-napi';
import ref from 'ref-napi';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';

const execAsync = promisify(exec);

const app = express();
app.use(express.json());

let connectedDevice = '';
let native = null;
let modemPort = null;
let modemParser = null;
let smsStatus = 'idle';
let callStatus = 'idle';

try {
  native = ffi.Library('./libphone', {
    init_sim: ['void', []],
    sim_read_iccid: ['int', ['char *', 'int']],
    init_bluetooth: ['void', []],
    bluetooth_start_pairing: ['int', ['string']],
  });
  native.init_sim();
  native.init_bluetooth();
} catch (err) {
  console.log('Native phone library not loaded:', err.message);
}

try {
  const path = process.env.MODEM_DEVICE || '/dev/ttyUSB0';
  modemPort = new SerialPort({ path, baudRate: 115200, autoOpen: false });
  modemParser = modemPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));
  modemPort.open(err => {
    if (err) {
      console.log('Failed to open modem port:', err.message);
    } else {
      console.log('Modem port opened at', path);
    }
  });
} catch (err) {
  console.log('SerialPort init error:', err.message);
}

async function runCtl(cmd) {
  try {
    const { stdout } = await execAsync(`bluetoothctl ${cmd}`);
    return stdout;
  } catch (err) {
    console.error(err);
    throw new Error('bluetoothctl failed');
  }
}

function sendAT(cmd, expect = /OK|ERROR/) {
  if (!modemPort || !modemPort.isOpen) {
    return Promise.reject(new Error('modem not available'));
  }
  return new Promise((resolve, reject) => {
    let resp = '';
    const onData = data => {
      resp += data + '\n';
      if (expect.test(data)) {
        cleanup();
        if (/ERROR/.test(data)) reject(new Error('modem error')); else resolve(resp);
      }
    };
    const onErr = err => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      modemParser.off('data', onData);
      modemPort.off('error', onErr);
      clearTimeout(timer);
    };
    modemParser.on('data', onData);
    modemPort.on('error', onErr);
    modemPort.write(cmd + '\r');
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('timeout'));
    }, 5000);
  });
}

app.post('/connect', async (req, res) => {
  const { address } = req.body || {};
  if (!address) return res.status(400).json({ error: 'address required' });
  try {
    await runCtl(`connect ${address}`);
    connectedDevice = address;
    res.json({ connected: true });
  } catch (err) {
    res.status(500).json({ error: 'connect failed' });
  }
});

app.post('/disconnect', async (_req, res) => {
  if (connectedDevice) {
    try {
      await runCtl(`disconnect ${connectedDevice}`);
    } catch {
      // ignore
    }
    connectedDevice = '';
  }
  res.json({ connected: false });
});

app.post('/pair', async (req, res) => {
  const { name } = req.body || {};
  if (native) {
    const ret = native.bluetooth_start_pairing(name || '');
    return res.json({ success: ret === 0 });
  }
  try {
    if (name) await runCtl(`system-alias ${name}`);
    await runCtl('pairable on');
    await runCtl('discoverable on');
    await runCtl('agent NoInputNoOutput');
    await runCtl('default-agent');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'pairing failed' });
  }
});

app.get('/status', (_req, res) => {
  res.json({
    connected: !!connectedDevice,
    device: connectedDevice,
    smsStatus,
    callStatus,
  });
});

app.post('/sms', async (req, res) => {
  const { to, body } = req.body || {};
  if (!to || !body) return res.status(400).json({ error: 'to and body required' });
  smsStatus = 'sending';
  try {
    await sendAT('AT');
    await sendAT('AT+CMGF=1');
    await sendAT(`AT+CMGS="${to}"`, />/);
    await sendAT(body + String.fromCharCode(26));
    smsStatus = 'sent';
    res.json({ success: true });
  } catch (err) {
    console.error('SMS failed', err.message);
    smsStatus = 'error';
    res.status(500).json({ error: 'send failed' });
  }
});

app.post('/call', async (req, res) => {
  const { number } = req.body || {};
  if (!number) return res.status(400).json({ error: 'number required' });
  callStatus = 'dialing';
  try {
    await sendAT('AT');
    await sendAT(`ATD${number};`);
    callStatus = 'in-call';
    res.json({ success: true });
  } catch (err) {
    console.error('Call failed', err.message);
    callStatus = 'error';
    res.status(500).json({ error: 'call failed' });
  }
});

app.get('/sim/iccid', (_req, res) => {
  if (native) {
    const buf = Buffer.alloc(32);
    const ret = native.sim_read_iccid(buf, buf.length);
    if (ret === 0) {
      const iccid = ref.readCString(buf, 0);
      return res.json({ iccid });
    }
    return res.status(500).json({ error: 'read failed' });
  }
  res.status(500).json({ error: 'not supported' });
});

app.post('/notify', (req, res) => {
  const { title, body } = req.body || {};
  console.log('notify', title, body);
  res.json({ success: true });
});

const PORT = process.env.PHONE_BRIDGE_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Phone bridge server listening on port ${PORT}`);
});
