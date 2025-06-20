#!/usr/bin/env node
// Simple helper to place locally built WASM models under src/wasm.
// In a real setup this script would invoke onnxruntime or ggml build steps.
// Here we simply verify the directory exists so the build pipeline can copy it.
import { mkdir } from 'fs/promises';
import path from 'path';

const outDir = path.join('src', 'wasm');
await mkdir(outDir, { recursive: true });
console.log('Place your compiled WASM models under', outDir);
