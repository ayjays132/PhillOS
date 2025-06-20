export async function loadSummarizer() {
  // Resolve the binary next to this file. Using import.meta.url keeps the path
  // working both in Node and in the browser.
  const wasmUrl = new URL('./summarizer.onnx.wasm', import.meta.url);
  const resp = await fetch(wasmUrl);
  if (!resp.ok) {
    throw new Error(`Failed to load summarizer WASM: ${resp.statusText}`);
  }
  const bytes = await resp.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes, {});

  // Many small demo modules simply export a single callable function. We look
  // for common names and return whichever is present so callers can invoke the
  // summarizer directly.
  const fn = (instance.exports as any).summarize ||
             (instance.exports as any).main ||
             (instance.exports as any).default;
  if (typeof fn !== 'function') {
    throw new Error('summarizer module has no callable export');
  }
  return fn as (...args: any[]) => any;
}
