import PatientPageWrapper from "../PatientPageWrapper"
import { DualActionFooter } from "@/Routes/shell/footers"
import { useNavigate, useLocation } from "react-router-dom"
import useNextKYCStep from "../../hooks/useNextKYCStep"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useToast } from "@/hooks/useToast"
import upgradeMembershipIcon from "@/assets/icons/upgrade-membership.png"
import Loader from "@/components/Loader"
import { useOfflinePatientData } from "@/hooks/useOfflinePatientData"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { useEffect } from "react"
import { trackEvent, EVENTS } from "@/analytics"

export default function PatientPayMembership() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const nextStep = useNextKYCStep()
  const userFromStore = usePatientAuthStore((state: any) => state.user) || {}
  const setUser = usePatientAuthStore((state: any) => state.setUser)

  // Fetch network data to ensure step 3 shows as completed in stepper
  const { data: networkData } = useOfflinePatientData<{
    network: any[]
    invites: any[]
    receivedInvites: any[]
  }>({
    endpoint: "/patient-network/network",
    fetchFn: async () => {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patient-network/network`,
        {
          credentials: "include",
        }
      )
      if (!resp.ok) {
        const text = await resp.text().catch(() => "")
        throw new Error(text || `Request failed with status ${resp.status}`)
      }
      return resp.json()
    },
  })

  // Update user store with network data so stepper can check completion
  useEffect(() => {
    if (networkData) {
      const hasNetworkData =
        Array.isArray(userFromStore?.network) &&
        Array.isArray(userFromStore?.invites)
      if (!hasNetworkData) {
        setUser({
          ...userFromStore,
          network: networkData.network || [],
          invites: networkData.invites || [],
        })
      }
    }
    // Intentional one-shot sync gated by hasNetworkData check; userFromStore would loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkData])

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.KYC.MEMBERSHIP_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        plan: "JIREH_PLUS",
      }

      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL + "/patients/submit-plan-details",
        payload
      )

      return response.data
    },
    onSuccess: (data: any) => {
      try {
        trackEvent(EVENTS.KYC.MEMBERSHIP_SUCCESS, {
          hasAuthorizationUrl: !!data.authorizationUrl,
        })
      } catch {
        // Silent fail
      }

      if (data.authorizationUrl) {
        window.location.assign(data.authorizationUrl)
        return
      }

      navigate(nextStep || "/patients", { state: location.state })
    },
    onError: (error: any) => {
      try {
        trackEvent(EVENTS.KYC.MEMBERSHIP_ERROR, {
          errorMessage: error?.response?.data?.message || error?.message,
        })
      } catch {
        // Silent fail
      }

      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const handlePay = () => {
    try {
      trackEvent(EVENTS.KYC.MEMBERSHIP_SUBMIT)
    } catch {
      // Silent fail
    }
    mutation.mutate()
  }

  return (
    <PatientPageWrapper
      title="Pay Membership"
      className="items-center"
      footer={
        <DualActionFooter
          secondary={{
            label: "Later",
            onClick: () =>
              navigate(nextStep || "/patients/", { state: location.state }),
            disabled: mutation.isPending,
          }}
          primary={{
            label: mutation.isPending ? (
              <div className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                <span>Sending payment prompt</span>
              </div>
            ) : (
              "Pay KES 499"
            ),
            onClick: handlePay,
            disabled: mutation.isPending || mutation.isSuccess,
          }}
        />
      }
    >
      <div className="w-full flex flex-col gap-6 h-full">
        <div className="flex flex-col items-center gap-2 mt-4">
          <h1 className="text-xl  text-center">
            Pay KES 499 to upgrade to Jireh Plus.
          </h1>
          <p className="text-neutral-500 text-center">
            Jireh Plus grants you access to interest-free medical loans.
          </p>
        </div>

        <div className="flex justify-center my-6">
          {/* Using cashIcon as placeholder, or ideally a shield icon if available */}
          <img
            src={upgradeMembershipIcon}
            alt="Upgrade to Jireh Plus"
            className="w-40 h-40 object-contain"
          />
        </div>

        <div className="mt-auto flex flex-col gap-4 mb-6">
          <p className="text-center text-neutral-600 text-sm px-4">
            You will receive a prompt to pay KES 499 to Jireh Health via MPesa,
            MPesa Till or Airtel Money.
          </p>
        </div>
      </div>
    </PatientPageWrapper>
  )
}
