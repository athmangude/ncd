/**
 * Stub for `@amplitude/analytics-browser`.
 *
 * Some files import the Amplitude SDK directly (namespace imports) and call
 * `amplitude.track/flush/setUserId/identify`. The prototype has no analytics
 * backend, so every function is a no-op. Exports match the SDK surface used.
 */

export function init(..._args: unknown[]) {}
export function add(..._args: unknown[]) {}
export function track(..._args: unknown[]) {}
export function flush(..._args: unknown[]) {}
export function setUserId(..._args: unknown[]) {}
export function getUserId(): string | undefined {
  return undefined
}
export function getSessionId(): number | undefined {
  return undefined
}
export function reset(..._args: unknown[]) {}
export function identify(..._args: unknown[]) {}

export class Identify {
  set(): this {
    return this
  }
  setOnce(): this {
    return this
  }
  add(): this {
    return this
  }
  append(): this {
    return this
  }
  prepend(): this {
    return this
  }
}

export default {
  init,
  add,
  track,
  flush,
  setUserId,
  getUserId,
  getSessionId,
  reset,
  identify,
  Identify,
}
