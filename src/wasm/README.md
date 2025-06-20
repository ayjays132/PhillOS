This directory is meant to hold WebAssembly builds of local AI models.

The actual WASM binaries are not tracked in git. Instead run `npm run build-wasm`
to copy prebuilt artifacts from the project `models/` directory or place them
here manually.

Expected files:
- `summarizer.onnx.wasm`
- `classifier.ggml.wasm`

The `services/modelManager.ts` module dynamically loads these artifacts when
available. If they are missing the system falls back to the JS pipelines from
`@xenova/transformers`.

### Building models

1. Put your compiled WASM files (or source `.onnx`/`.ggml` models you have
   converted) into the top-level `models/` directory. The build script expects:
   - `models/summarizer.onnx.wasm`
   - `models/classifier.ggml.wasm`
2. Run `npm run build-wasm`. The script copies these files into `src/wasm` so
   they can be loaded at runtime.
