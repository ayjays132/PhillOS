export interface OnnxRuntimeExports {
  memory: WebAssembly.Memory;
  inference(inputPtr: number, length: number): number;
}

export interface GgmlRuntimeExports {
  memory: WebAssembly.Memory;
  generate(ptr: number, length: number): number;
}

const defaultOnnxUrl = new URL('./onnx-runtime.wasm', import.meta.url).toString();
const defaultGgmlUrl = new URL('./ggml-runtime.wasm', import.meta.url).toString();

let onnxRuntime: Promise<OnnxRuntimeExports> | null = null;
let ggmlRuntime: Promise<GgmlRuntimeExports> | null = null;

async function loadWasm(url: string) {
  const response = await fetch(url);
  const { instance } = await WebAssembly.instantiateStreaming(response, {});
  return instance.exports;
}

export function loadOnnxRuntime(url: string = defaultOnnxUrl) {
  if (!onnxRuntime) {
    onnxRuntime = loadWasm(url) as Promise<OnnxRuntimeExports>;
  }
  return onnxRuntime;
}

export function loadGgmlRuntime(url: string = defaultGgmlUrl) {
  if (!ggmlRuntime) {
    ggmlRuntime = loadWasm(url) as Promise<GgmlRuntimeExports>;
  }
  return ggmlRuntime;
}
