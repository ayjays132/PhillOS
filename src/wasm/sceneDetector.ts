export interface Chapter { start: number; title: string; }

export async function loadSceneDetector() {
  try {
    const wasmUrl = new URL('./scene_detector.wasm', import.meta.url);
    const resp = await fetch(wasmUrl);
    if (resp.ok) {
      const bytes = await resp.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(bytes, {});
      const fn = (instance.exports as any).detect ||
                 (instance.exports as any).main ||
                 (instance.exports as any).default;
      if (typeof fn === 'function') {
        return async (buf: ArrayBuffer): Promise<Chapter[]> => {
          // The wasm demo is expected to return an array pointer or JSON string.
          // For simplicity we assume it returns a JSON string.
          const memory = (instance.exports as any).memory as WebAssembly.Memory;
          const offset = (instance.exports as any).alloc(buf.byteLength) as number;
          new Uint8Array(memory.buffer, offset, buf.byteLength).set(new Uint8Array(buf));
          const ptr = fn(offset, buf.byteLength) as number;
          const view = new Uint8Array(memory.buffer, ptr);
          let str = '';
          for (let i = 0; view[i] !== 0; i++) str += String.fromCharCode(view[i]);
          return JSON.parse(str) as Chapter[];
        };
      }
    }
  } catch {
    // ignore
  }
  // Fallback dummy detector producing fixed chapters
  return async (_buf: ArrayBuffer): Promise<Chapter[]> => {
    const chapters: Chapter[] = [];
    const step = 60 / 5;
    for (let i = 0; i < 5; i++) chapters.push({ start: i * step, title: `Scene ${i + 1}` });
    return chapters;
  };
}
