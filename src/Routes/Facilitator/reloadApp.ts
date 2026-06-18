/**
 * Reload the app after a facilitator edit so React Query refetches against the
 * freshly mutated mock state. Isolated in its own module so tests can mock it
 * without triggering a real navigation.
 */
export function reloadApp(): void {
  window.location.reload()
}
