import "@testing-library/jest-dom/vitest"
import { afterEach } from "vitest"
import { cleanup } from "@testing-library/react"

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
