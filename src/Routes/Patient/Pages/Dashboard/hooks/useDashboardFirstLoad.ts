import type { DashboardAnimationMode } from "../components/DashboardStagger"

/**
 * Decides which of the two dashboard motions to play, driven by live query
 * state rather than a one-shot "have we ever loaded" flag:
 *  - loading with no data yet → show the shared skeleton, then play the
 *    staggered "intro" once data arrives.
 *  - loading WITH data already present (a refetch) → replay the "intro" —
 *    this falls out naturally, no special-casing needed.
 *  - not loading (cached/fresh) → skip the skeleton, play the snappy
 *    "switch" reveal only.
 *
 * Each tab computes its own `isLoading`/`hasData` from whatever queries it
 * uses (they differ per tab) and passes the two booleans in.
 */
export function useDashboardFirstLoad(
  isLoading: boolean,
  hasData: boolean
): { showSkeleton: boolean; mode: DashboardAnimationMode } {
  if (isLoading && !hasData) {
    return { showSkeleton: true, mode: "intro" }
  }
  if (isLoading && hasData) {
    return { showSkeleton: false, mode: "intro" }
  }
  return { showSkeleton: false, mode: "switch" }
}
