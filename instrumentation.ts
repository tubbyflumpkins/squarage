/**
 * Next.js Instrumentation - Server-side Storage Polyfill
 *
 * Node.js v25+ exposes a built-in `localStorage` global that is an empty object
 * without the standard Storage methods (getItem, setItem, etc.). This causes
 * crashes during SSR when any code references localStorage.getItem().
 *
 * This file runs before any other application code in Next.js 15 and replaces
 * the broken globals with proper no-op Storage implementations.
 */

function createNoopStorage(): Storage {
  return {
    getItem(_key: string): string | null {
      return null;
    },
    setItem(_key: string, _value: string): void {},
    removeItem(_key: string): void {},
    clear(): void {},
    key(_index: number): string | null {
      return null;
    },
    length: 0,
  };
}

export function register() {
  if (typeof window === 'undefined') {
    globalThis.localStorage = createNoopStorage();
    globalThis.sessionStorage = createNoopStorage();
  }
}
