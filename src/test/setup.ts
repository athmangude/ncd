import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

// Node 25 ships a built-in `localStorage` global that lacks the full Storage
// API (getItem, setItem, removeItem, clear, key, length). It overrides jsdom's
// proper implementation, breaking every test that touches localStorage. Polyfill
// it here so the rest of the codebase can call the standard Storage methods.
if (
  typeof globalThis.localStorage !== "undefined" &&
  typeof globalThis.localStorage.clear !== "function"
) {
  const store = new Map<string, string>()
  const storage: Storage = {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return [...store.keys()][index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, String(value))
    },
  }
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    writable: true,
    configurable: true,
  })
  // Ensure window.localStorage points to the same object in jsdom contexts.
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", {
      value: storage,
      writable: true,
      configurable: true,
    })
  }
}

// jsdom does not implement ResizeObserver, which some components (e.g. the
// input-otp PIN input) instantiate on mount. Provide a no-op polyfill.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom does not implement matchMedia, which the PWA-install detection
// (usePwaInstall / useNextPWAOnboardingStep, reached transitively when a screen
// renders the canonical shell + journey stepper) calls. Provide a stub that
// reports "no match" so tests rendering the shell don't throw unhandled errors.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

afterEach(() => {
  cleanup()
})
