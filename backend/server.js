import express from 'express';
import { createProtonLauncher } from './protonLauncher.js';

const app = express();
app.use(express.json());

app.post('/api/launch-proton', async (req, res) => {
  const { path, version, prefix, wine } = req.body || {};

  if (!path) {
    return res.status(400).json({ error: 'path required' });
  }

  try {
    const launcher = createProtonLauncher({ version, prefix, wineBinary: wine });
    await launcher.launch(path);
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to launch';
    res.status(500).json({ error: message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Proton launcher server listening on port ${PORT}`);
});
