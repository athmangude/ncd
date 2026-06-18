import { type ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useFastTrackStore } from "./useFastTrackStore"

const PREFIX = "/patients/fast-track"

interface StepRequirements {
  hasProvider: boolean
  hasInvoiceDetails: boolean
  hasPatient: boolean
  hasSplits: boolean
  hasTransaction: boolean
  paymentSubmitted: boolean
}

function getRedirectPath(
  pathname: string,
  req: StepRequirements
): string | null {
  if (req.paymentSubmitted && pathname !== `${PREFIX}/status`) {
    return `${PREFIX}/status`
  }

  switch (pathname) {
    case `${PREFIX}/resolve-provider`:
      return null

    case `${PREFIX}/payment-details`:
      if (!req.hasProvider) return `${PREFIX}/resolve-provider`
      return null

    case `${PREFIX}/wallet-selection`:
      if (!req.hasProvider) return `${PREFIX}/resolve-provider`
      if (!req.hasInvoiceDetails || !req.hasPatient)
        return `${PREFIX}/payment-details`
      return null

    case `${PREFIX}/confirm`:
      if (!req.hasProvider) return `${PREFIX}/resolve-provider`
      if (!req.hasInvoiceDetails || !req.hasPatient)
        return `${PREFIX}/payment-details`
      if (!req.hasSplits) return `${PREFIX}/wallet-selection`
      return null

    case `${PREFIX}/status`:
      if (!req.hasTransaction && !req.paymentSubmitted)
        return `${PREFIX}/resolve-provider`
      return null

    default:
      return null
  }
}

export default function FastTrackStepGuard({
  children,
}: {
  children: ReactNode
}) {
  const { pathname } = useLocation()

  const provider = useFastTrackStore((s) => s.provider)
  const invoiceNumber = useFastTrackStore((s) => s.invoiceNumber)
  const invoiceAmount = useFastTrackStore((s) => s.invoiceAmount)
  const patient = useFastTrackStore((s) => s.patient)
  const splits = useFastTrackStore((s) => s.splits)
  const transaction = useFastTrackStore((s) => s.transaction)
  const paymentSubmitted = useFastTrackStore((s) => s.paymentSubmitted)

  const redirect = getRedirectPath(pathname, {
    hasProvider: provider !== null,
    hasInvoiceDetails:
      invoiceNumber.trim() !== "" && parseFloat(invoiceAmount) > 0,
    hasPatient: patient !== null,
    hasSplits: splits.length > 0,
    hasTransaction: transaction !== null,
    paymentSubmitted,
  })

  if (redirect) return <Navigate to={redirect} replace />

  return <>{children}</>
}
