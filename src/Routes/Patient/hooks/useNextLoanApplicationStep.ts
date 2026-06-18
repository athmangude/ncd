import { useLocation } from "react-router-dom"

const prefix = "/patients/payment/request-payment"

export const LOAN_APPLICATION_STEPS = [
  `${prefix}/upload-invoice`,
  `${prefix}/review-invoice`,
  `${prefix}/wallet-selection`,
  `${prefix}/payment-confirmation`,
  `${prefix}/payment-result`,
]

export const loanApplicationRoutes = new Map<string, string>([
  ["/patients/care-fund", `${prefix}/how-to-pay`],
  ["/patients", `${prefix}/how-to-pay`],
  [`${prefix}/how-to-pay`, `${prefix}/upload-invoice`],
  [`${prefix}/upload-invoice`, `${prefix}/review-invoice`],
  [`${prefix}/review-invoice`, `${prefix}/wallet-selection`],
  [`${prefix}/wallet-selection`, `${prefix}/payment-confirmation`],
  [`${prefix}/payment-confirmation`, `${prefix}/payment-result`],
  [`${prefix}/payment-result`, "/patients/home"],
])

export default function useNextLoanApplicationStep() {
  const location = useLocation()

  return loanApplicationRoutes.get(location.pathname) || `${prefix}/how-to-pay`
}
