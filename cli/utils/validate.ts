export const unsafeArgPattern = /[;&|`$><]/;

export function sanitizeArgs(values: string[]): void {
  if (values.some(v => unsafeArgPattern.test(v))) {
    throw new Error('Unsafe arguments detected');
  }
}
