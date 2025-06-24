#!/usr/bin/env node
import { mkdir, copyFile, access } from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const projectRoot = process.cwd();
const modelDir = path.join(projectRoot, 'models');
const outDir = path.join(projectRoot, 'src', 'wasm');
await mkdir(modelDir, { recursive: true });
await mkdir(outDir, { recursive: true });

const HF_MODELS = {
  summarizer: "sshleifer/distilbart-cnn-12-6",
  classifier: "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
  translator: "Helsinki-NLP/opus-mt-en-ROMANCE" // <-- the working translation model
};

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: 'inherit', ...opts });
    p.on('close', code => {
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with code ${code}`));
    });
  });
}

async function fileExists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function downloadAndExport() {
  const pyScript = `
import os
from optimum.onnxruntime import ORTModelForSequenceClassification, ORTModelForSeq2SeqLM
from transformers import AutoTokenizer

os.makedirs("models", exist_ok=True)

def export(model_cls, repo, out):
    try:
        print("Exporting", repo)
        tokenizer = AutoTokenizer.from_pretrained(repo)
        model = model_cls.from_pretrained(repo, export=True)
        model.save_pretrained(out)
        tokenizer.save_pretrained(out)
        print("Saved to", out)
    except Exception as e:
        print(f"Failed to export {repo}: {e}")

export(ORTModelForSeq2SeqLM, "${HF_MODELS.summarizer}", "models/summarizer")
export(ORTModelForSequenceClassification, "${HF_MODELS.classifier}", "models/classifier")
export(ORTModelForSeq2SeqLM, "${HF_MODELS.translator}", "models/translator")
`;

  try {
    await run('python', ['-c', pyScript]);
  } catch (err) {
    console.error("Python export failed:", err.message);
    process.exit(1);
  }
}

const artefacts = [
  // summarizer
  {
    name: 'summarizer.encoder.onnx.wasm',
    src: path.join(modelDir, 'summarizer', 'encoder_model.onnx'),
    wasm: path.join(modelDir, 'summarizer.encoder.onnx.wasm'),
    build: async (src, out) => { await run('onnxruntime_web', ['wasm', src, '--out', out]); }
  },
  {
    name: 'summarizer.decoder.onnx.wasm',
    src: path.join(modelDir, 'summarizer', 'decoder_model.onnx'),
    wasm: path.join(modelDir, 'summarizer.decoder.onnx.wasm'),
    build: async (src, out) => { await run('onnxruntime_web', ['wasm', src, '--out', out]); }
  },
  {
    name: 'summarizer.decoder_with_past.onnx.wasm',
    src: path.join(modelDir, 'summarizer', 'decoder_with_past_model.onnx'),
    wasm: path.join(modelDir, 'summarizer.decoder_with_past.onnx.wasm'),
    build: async (src, out) => { await run('onnxruntime_web', ['wasm', src, '--out', out]); }
  },
  // classifier
  {
    name: 'classifier.onnx.wasm',
    src: path.join(modelDir, 'classifier', 'model.onnx'),
    wasm: path.join(modelDir, 'classifier.onnx.wasm'),
    build: async (src, out) => { await run('onnxruntime_web', ['wasm', src, '--out', out]); }
  },
  // translator
  {
    name: 'translator.encoder.onnx.wasm',
    src: path.join(modelDir, 'translator', 'encoder_model.onnx'),
    wasm: path.join(modelDir, 'translator.encoder.onnx.wasm'),
    build: async (src, out) => { await run('onnxruntime_web', ['wasm', src, '--out', out]); }
  },
  {
    name: 'translator.decoder.onnx.wasm',
    src: path.join(modelDir, 'translator', 'decoder_model.onnx'),
    wasm: path.join(modelDir, 'translator.decoder.onnx.wasm'),
    build: async (src, out) => { await run('onnxruntime_web', ['wasm', src, '--out', out]); }
  },
  {
    name: 'translator.decoder_with_past.onnx.wasm',
    src: path.join(modelDir, 'translator', 'decoder_with_past_model.onnx'),
    wasm: path.join(modelDir, 'translator.decoder_with_past.onnx.wasm'),
    build: async (src, out) => { await run('onnxruntime_web', ['wasm', src, '--out', out]); }
  },
];

async function main() {
  await downloadAndExport();

  for (const art of artefacts) {
    const outPath = path.join(outDir, art.name);
    const srcExists = await fileExists(art.src);

    if (srcExists) {
      try {
        await art.build(art.src, art.wasm);
        console.log('Built', art.name);
      } catch (err) {
        console.warn(`Failed to build ${art.name}:`, err.message);
      }
      try {
        await copyFile(art.wasm, outPath);
        console.log('Copied', art.name);
      } catch (err) {
        console.warn('Missing artefact after build:', art.wasm);
      }
    } else {
      console.warn('Missing source for:', art.name, "(expected at", art.src, ")");
    }
  }

  // Final summary
  const missing = (await Promise.all(artefacts.map(a => fileExists(a.wasm)))).some(v => !v);
  if (missing) {
    console.warn('\nSome WASM artefacts are missing. Check for errors above.');
  } else {
    console.log('\n✅ All WASM models are built and copied!');
  }
}

main();
