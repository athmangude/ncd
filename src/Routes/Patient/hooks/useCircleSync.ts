import { useCallback } from "react"
import { QueryClient, useQueryClient } from "@tanstack/react-query"
import { patientLoginDetailsQueryKey } from "./useOnboardingChecklist"
import { myNetworkQueryKey } from "../Pages/Network/PatientMyNetwork"
import { patientConnectionsQueryKey } from "../Pages/Loans/RequestLoan/PatientSelectPatient"

/**
 * Every React Query cache that mirrors the single circle source of truth
 * (`mock:patient-network`). They're listed together so a change made anywhere —
 * the upgrade flow, the circle tab, a mid-payment add, or a gift — propagates to
 * all of them at once instead of leaving sibling views stale:
 *
 * - `patientLoginDetails` feeds the Zustand `user.patientCircle` / `network` /
 *   `type`, which the loan-eligibility gate and KYC checklist read.
 * - `myConnectionsKey` feeds the circle tab, the CircleWaitingDrawer, and the
 *   invitations-sent list.
 * - `patientConnections` feeds the payment + gift payee pickers.
 */
export const CIRCLE_QUERY_KEYS = [
  patientLoginDetailsQueryKey,
  myNetworkQueryKey,
  patientConnectionsQueryKey,
] as const

/** Invalidate every circle-dependent query so the whole app re-reads the circle. */
export function invalidateCircleQueries(queryClient: QueryClient): void {
  CIRCLE_QUERY_KEYS.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] })
  })
}

/**
 * Hook form of {@link invalidateCircleQueries}, bound to the active client. Call
 * the returned function after any circle/membership mutation (add, accept,
 * remove, upgrade) so the loan gate, circle tab, and payee pickers stay in sync.
 */
export function useCircleSync(): () => void {
  const queryClient = useQueryClient()
  return useCallback(() => invalidateCircleQueries(queryClient), [queryClient])
}
