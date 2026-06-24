import { Outlet } from "react-router-dom"
import { ProtectedRoute } from "@/components/ProtectedResource"
import { usePatientAuthStore } from "../stores/patientAuthStore"
import { MEMBER_LOAN_ROLES } from "../constants/userTypes"

/**
 * Route-level guard for the loan-only screens (financial statements + the MPESA
 * statement FAQs). Centralizes the role check that each of those pages used to
 * run for itself inside its own body, so the gate lives once at the route layer
 * and the leaf `ProtectedResource` usage becomes UX polish rather than the
 * safety net. Renders the matched child route via `<Outlet />` for eligible
 * roles; otherwise `ProtectedRoute` shows the not-authorized block.
 */
export default function MemberLoanRouteGuard() {
  const user = usePatientAuthStore((state) => state.user)

  return (
    <ProtectedRoute userRole={user?.type} allowedRoles={MEMBER_LOAN_ROLES}>
      <Outlet />
    </ProtectedRoute>
  )
}
