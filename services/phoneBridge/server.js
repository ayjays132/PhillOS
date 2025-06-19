import express from 'express';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const app = express();
app.use(express.json());

let connectedDevice = '';

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

app.post('/notify', (req, res) => {
  const { title, body } = req.body || {};
  console.log('notify', title, body);
  res.json({ success: true });
});

const PORT = process.env.PHONE_BRIDGE_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Phone bridge server listening on port ${PORT}`);
});
