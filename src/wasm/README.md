This directory contains WebAssembly builds of inference engines used by PhillOS.
Actual `.wasm` files are not stored in the repository. Instead, they can be
downloaded at build time using the `scripts/fetch-wasm.js` script. Place the
compiled ONNX and GGML runtime modules here so that Vite can package them under
`dist/wasm/`.
