export async function loadClassifier() {
  const wasmUrl = new URL('./classifier.ggml.wasm', import.meta.url);
  const resp = await fetch(wasmUrl);
  if (!resp.ok) {
    throw new Error(`Failed to load classifier WASM: ${resp.statusText}`);
  }
  const bytes = await resp.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {});
  const fn = (instance.exports as any).classify ||
             (instance.exports as any).main ||
             (instance.exports as any).default;
  if (typeof fn !== 'function') {
    throw new Error('classifier module has no callable export');
  }
  return fn as (...args: any[]) => any;
}
