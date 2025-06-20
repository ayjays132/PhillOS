#!/usr/bin/env node
// Build or copy WebAssembly model binaries into `src/wasm`.
//
// This script looks for prebuilt artefacts under `models/` and copies them
// next to the TypeScript loaders.  In a real project you might invoke
// onnxruntime or ggml here to compile `.onnx` or `.ggml` files to WASM.

import { mkdir, copyFile, access } from 'fs/promises';
import path from 'path';

const projectRoot = process.cwd();
const outDir = path.join(projectRoot, 'src', 'wasm');
await mkdir(outDir, { recursive: true });

const artefacts = [
  { name: 'summarizer.onnx.wasm', src: path.join(projectRoot, 'models', 'summarizer.onnx.wasm') },
  { name: 'classifier.ggml.wasm', src: path.join(projectRoot, 'models', 'classifier.ggml.wasm') },
];

for (const { name, src } of artefacts) {
  try {
    await access(src);
    await copyFile(src, path.join(outDir, name));
    console.log('Copied', name);
  } catch {
    console.warn('Missing artefact:', src);
  }
}
