export async function loadClassifier() {
  try {
    const wasmUrl = new URL('./classifier.ggml.wasm', import.meta.url);
    const resp = await fetch(wasmUrl);
    if (!resp.ok) return null;
    const bytes = await resp.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(bytes, {});
    const fn = (instance.exports as any).classify ||
               (instance.exports as any).main ||
               (instance.exports as any).default;
    if (typeof fn !== 'function') return null;
    return fn as (...args: any[]) => any;
  } catch {
    return null;
  }
}
