This directory is meant to hold WebAssembly builds of local AI models.

The actual WASM binaries are not tracked in git. Instead run `npm run build-wasm`
to generate them or place prebuilt artifacts here manually.

Expected files:
- `summarizer.onnx.wasm`
- `classifier.ggml.wasm`

The `services/modelManager.ts` module dynamically loads these artifacts when
available. If they are missing the system falls back to the JS pipelines from
`@xenova/transformers`.
