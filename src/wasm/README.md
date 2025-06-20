This directory is meant to hold WebAssembly builds of local AI models.

The actual WASM binaries are not tracked in git. Run `npm run build-wasm` to
compile or copy them from the project `models/` directory. When `.onnx` or
`.ggml` sources are present the script invokes the `onnxruntime-web` or `ggml`
toolchains to produce the final `.wasm` files.

Expected files:
- `summarizer.onnx.wasm`
- `classifier.ggml.wasm`

The `services/modelManager.ts` module dynamically loads these artifacts when
available. If they are missing the system falls back to the JS pipelines from
`@xenova/transformers`.

### Building models

1. Place either prebuilt WASM files or the source `.onnx`/`.ggml` models in the
   top-level `models/` directory. The script looks for:
   - `models/summarizer.onnx` or `models/summarizer.onnx.wasm`
   - `models/classifier.ggml` or `models/classifier.ggml.wasm`
2. Run `npm run build-wasm`. The files are compiled if needed and copied into
   `src/wasm` so they can be loaded at runtime.
