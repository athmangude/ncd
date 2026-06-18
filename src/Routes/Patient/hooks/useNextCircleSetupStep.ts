import { useLocation } from "react-router-dom"

export const CIRCLE_SETUP_START_URL = "/patients/circle-setup-intro"

const routes: { [key: string]: string } = {
  "/patients/circle-setup-intro": "/patients/add-to-circle",
  "/patients/add-to-circle": "/patients/",
}

export default function useNextCircleSetupStep() {
  const location = useLocation()
  return routes[location.pathname]
}
