import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { usePatientAuthStore } from "../stores/patientAuthStore"

export const patientLoginDetailsQueryKey = "patientLoginDetails"

export function useOnboardingChecklist() {
  const navigate = useNavigate()
  const setUser = usePatientAuthStore((state: any) => state.setUser)
  //
  return useQuery({
    queryKey: [patientLoginDetailsQueryKey],
    queryFn: async () => {
      //various onboarding checks
      try {
        const res = await axios.get(
          import.meta.env.VITE_API_BASE_URL + "/patients/login-details"
        )

        let onboardingRedirectLink = ""

        function setUserDetails() {
          const userDetails = {
            ...res.data,
            onboardingRedirectLink,
          }

          setUser(userDetails)
          return userDetails
        }


        const {  firstName, lastName , hasSetPin} = res.data
        if (!firstName || !lastName) {
          onboardingRedirectLink = "/patients/personal-details"
          return setUserDetails()
        }
        if(!hasSetPin){
          onboardingRedirectLink = "/patients/set-pin"
          return setUserDetails()
        }



        onboardingRedirectLink = ""
        return setUserDetails()
      } catch (error: any) {
        if (error.response?.status === 401) {
          navigate("/patients/auth/login")
          return null
        }

        if (error.response?.status === 403) {
          navigate("/invalid-tenant")
          return null
        }

        throw error
      }
    },
  })
}

export async function checkPwaIsIntalled() {
  //check local storage to see if user has skipped installation
  if (localStorage.getItem("pwaInstallSkipped") === "true") return true

  // Check display mode
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
  if (isStandalone) return true

  // Check localStorage flag
  if (localStorage.getItem("pwaInstalled") === "true") return true

  // Check installed related apps (if supported)
  if ("getInstalledRelatedApps" in window) {
    const relatedApps = await (window as any).getInstalledRelatedApps()
    return relatedApps.some((app: any) => app.id === "your-pwa-id")
  }

  return false
}
