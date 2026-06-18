import { useLocation } from "react-router-dom"

const prefix = "/patients/fast-track"

export const FAST_TRACK_STEPS = [
  `${prefix}/resolve-provider`,
  `${prefix}/payment-details`,
  `${prefix}/wallet-selection`,
  `${prefix}/confirm`,
]

export const fastTrackRoutes = new Map<string, string>([
  [`${prefix}`, `${prefix}/resolve-provider`],
  [`${prefix}/resolve-provider`, `${prefix}/payment-details`],
  [`${prefix}/payment-details`, `${prefix}/wallet-selection`],
  [`${prefix}/wallet-selection`, `${prefix}/confirm`],
  [`${prefix}/confirm`, `${prefix}/status`],
  [`${prefix}/status`, "/patients/home"],
])

export default function useNextFastTrackStep() {
  const location = useLocation()

  return fastTrackRoutes.get(location.pathname) || `${prefix}/resolve-provider`
}
