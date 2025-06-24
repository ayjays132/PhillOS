export async function loadTranslator() {
  const wasmUrl = new URL('./translator.onnx.wasm', import.meta.url);
  const resp = await fetch(wasmUrl);
  if (!resp.ok) {
    throw new Error(`Failed to load translator WASM: ${resp.statusText}`);
  }
  const bytes = await resp.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const fn = (instance.exports as any).translate ||
             (instance.exports as any).main ||
             (instance.exports as any).default;
  if (typeof fn !== 'function') {
    throw new Error('translator module has no callable export');
  }
  return fn as (...args: any[]) => any;
}
