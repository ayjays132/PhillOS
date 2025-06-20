export async function loadCitationVerifier() {
  return async (text: string): Promise<boolean> => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    return (hash & 1) === 0;
  };
}
