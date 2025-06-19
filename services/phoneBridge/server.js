import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';
import ffi from 'ffi-napi';
import ref from 'ref-napi';

const execAsync = promisify(exec);

const app = express();
app.use(express.json());

let connectedDevice = '';
let native = null;

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

async function runCtl(cmd) {
  try {
    const { stdout } = await execAsync(`bluetoothctl ${cmd}`);
    return stdout;
  } catch (err) {
    console.error(err);
    throw new Error('bluetoothctl failed');
  }
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
  res.json({ connected: !!connectedDevice, device: connectedDevice });
});

app.post('/sms', (req, res) => {
  const { to, body } = req.body || {};
  console.log('sendSms', to, body);
  res.json({ success: true });
});

app.post('/call', (req, res) => {
  const { number } = req.body || {};
  console.log('makeCall', number);
  res.json({ success: true });
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
