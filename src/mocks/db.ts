/**
 * Tiny localStorage-backed store for the mock API.
 *
 * Handlers seed state from editable JSON fixtures the first time, then read and
 * write through here so user actions (creating loans, leaving reviews, toggling
 * favorites, progressing onboarding) persist across reloads. Clear all mock
 * state by removing the `mock:*` localStorage keys (or via Profile → sign out).
 */

const PREFIX = "mock:"

/**
 * Bump this whenever a fixture's *shape* changes (a new field added to
 * `patient-login-details.json`, etc.). Stored state is seeded into localStorage
 * on first read and never re-seeded, so without a version gate an existing
 * participant keeps an outdated object forever. On a version mismatch we drop
 * all `mock:*` keys so every collection re-seeds from its current fixture.
 */
export const SEED_VERSION = "2026-06-18-fresh-default-account"
const SEED_VERSION_KEY = PREFIX + "__seed_version__"

// Session + returning-user flags live outside the `mock:` namespace; a version
// bump clears them too so existing participants re-enter the new fresh-default
// model instead of keeping a stale fully-onboarded "Amina" session.
const SESSION_FLAG_KEYS = ["mock_session_exists", "mock_user_id", "mock_has_account"]

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

/** Wipe stale `mock:*` state when the seed version changes. Safe to call repeatedly. */
export function migrateSeedVersion(): void {
  try {
    if (localStorage.getItem(SEED_VERSION_KEY) === SEED_VERSION) return

    const toRemove: string[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && key.startsWith(PREFIX)) toRemove.push(key)
    }
    toRemove.forEach((key) => localStorage.removeItem(key))
    SESSION_FLAG_KEYS.forEach((key) => localStorage.removeItem(key))
    localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION)
  } catch {
    // localStorage may be unavailable (private mode / SSR) — fixtures still
    // seed in-memory per read, so this is best-effort only.
  }
}

/** Read a single object, seeding from `seed` on first access. */
export function readObject<T>(key: string, seed: T): T {
  const raw = localStorage.getItem(PREFIX + key)
  if (raw !== null) {
    try {
      return JSON.parse(raw) as T
    } catch {
      // fall through and reseed
    }
  }
  const fresh = deepClone(seed)
  localStorage.setItem(PREFIX + key, JSON.stringify(fresh))
  return fresh
}

export function writeObject<T>(key: string, value: T): void {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

/** Patch a stored object (shallow merge) and return the merged result. */
export function patchObject<T extends object>(
  key: string,
  seed: T,
  patch: Partial<T>
): T {
  const current = readObject<T>(key, seed)
  const merged = { ...current, ...patch }
  writeObject(key, merged)
  return merged
}

/** Read an array collection, seeding from `seed` on first access. */
export function readCollection<T>(key: string, seed: T[]): T[] {
  return readObject<T[]>(key, seed)
}

export function writeCollection<T>(key: string, items: T[]): void {
  writeObject(key, items)
}

/** Generate a short, stable-enough id without Math.random restrictions. */
let counter = 0
export function makeId(prefix = "id"): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}
