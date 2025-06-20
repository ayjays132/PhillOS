#!/usr/bin/env node
// Build or copy WebAssembly model binaries into `src/wasm`.
//
// The previous version of this script only copied prebuilt WASM files from
// `models/`.  It now attempts to compile `.onnx` or `.ggml` sources when the
// corresponding WASM artefacts are missing.  The build steps rely on the
// `onnxruntime-web` and `ggml` toolchains being available in the system `PATH`.
// If the tools are not present the script falls back to copying any existing
// WASM files so the rest of the build can continue.

import { mkdir, copyFile, access } from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, 'src', 'wasm');
await mkdir(outDir, { recursive: true });

async function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit' });
    p.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function fileExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

const artefacts = [
  {
    name: 'summarizer.onnx.wasm',
    wasm: path.join(projectRoot, 'models', 'summarizer.onnx.wasm'),
    src: path.join(projectRoot, 'models', 'summarizer.onnx'),
    build: async (src, out) => {
      // Example invocation using onnxruntime-web's build tool
      await run('onnxruntime_web', ['wasm', src, '--out', out]);
    },
  },
  {
    name: 'classifier.ggml.wasm',
    wasm: path.join(projectRoot, 'models', 'classifier.ggml.wasm'),
    src: path.join(projectRoot, 'models', 'classifier.ggml'),
    build: async (src, out) => {
      await run('ggml-wasm', [src, '-o', out]);
    },
  },
];

for (const art of artefacts) {
  const outPath = path.join(outDir, art.name);
  const wasmExists = await fileExists(art.wasm);
  const srcExists = await fileExists(art.src);

  if (!wasmExists && srcExists) {
    try {
      await art.build(art.src, art.wasm);
      console.log('Built', art.name);
    } catch (err) {
      console.warn(`Failed to build ${art.name}:`, err.message);
    }
  }

  try {
    await access(art.wasm);
    await copyFile(art.wasm, outPath);
    console.log('Copied', art.name);
  } catch {
    console.warn('Missing artefact:', art.wasm);
  }
}
