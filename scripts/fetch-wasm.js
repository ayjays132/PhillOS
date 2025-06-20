import fs from 'fs';
import path from 'path';
import https from 'https';

const files = [
  {
    url: process.env.ONNX_WASM_URL || 'https://example.com/onnx-runtime.wasm',
    name: 'onnx-runtime.wasm'
  },
  {
    url: process.env.GGML_WASM_URL || 'https://example.com/ggml-runtime.wasm',
    name: 'ggml-runtime.wasm'
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) {
        reject(new Error('Failed to download ' + url));
        return;
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

(async () => {
  const outDir = path.resolve('src/wasm');
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of files) {
    const dest = path.join(outDir, f.name);
    if (!fs.existsSync(dest)) {
      try {
        await download(f.url, dest);
        console.log('Downloaded', f.name);
      } catch (e) {
        console.warn('Could not download', f.url, e.message);
      }
    }
  }
})();
