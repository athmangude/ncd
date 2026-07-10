import { DashboardSkeleton } from "./DashboardSkeleton"

/**
 * Suspense fallback for each lazy-loaded dashboard tab. The app bar and tab
 * bar are already mounted (this only fills the Outlet inside
 * DashboardTabContent), so it renders bare — no TabsContent/page chrome.
 *
 * Uses the SAME shared skeleton as a tab's own first-load state, so the
 * "downloading this tab's code" wait and "loading this tab's data" wait
 * read as one continuous loading treatment instead of two different loaders
 * flashing in sequence (a spinner, then a skeleton).
 */
export function DashboardTabFallback() {
  return <DashboardSkeleton className="flex flex-col gap-6 p-4 w-full" />
}
