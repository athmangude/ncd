import ErrorBlock from "@/components/ErrorBlock"
import LoadingPage from "@/Routes/LoadingPage"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { useNavigate, useSearchParams } from "react-router-dom"

const validateReferralQueryKey = "validateReferral"

export default function PatientValidateReferral() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: [validateReferralQueryKey],
    queryFn: async () => {
      try {
        const inviteId = searchParams.get("inviteId")
        const referrerId = searchParams.get("referrerId")

        const navigateTo = "/patients"

        if (inviteId) {
          localStorage.setItem("inviteId", inviteId)
        } else if (referrerId) {
          localStorage.setItem("referrerId", referrerId)
        }

        await axios.get(
          import.meta.env.VITE_API_BASE_URL + "/patients/login-details"
        )

        navigate(navigateTo)

        return null
      } catch (error: any) {
        if (error.response?.status === 401) {
          navigate("/", { state: { from: "referral" } })
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

  if (query.isLoading) {
    return <LoadingPage />
  }

  if (query.isError) {
    const error: any = query.error
    return <ErrorBlock message={error.response?.data.message} />
  }

  return <>Validate referral</>
}
