import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useNextMembershipSetupStep from "../../hooks/useNextMembershipSetupStep"
import { useCircleSync } from "../../hooks/useCircleSync"
import PatientPageWrapper from "../PatientPageWrapper"
import { HERO_ILLUSTRATION } from "@/Routes/shell/PageHeader"
import successImage from "@/assets/icons/id-verification-success.png"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Button } from "@/components/Button"

const getPatientCreditLimitKey = "patientCreditLimit"

export function PatientMembershipSuccess() {
  const next = useNextMembershipSetupStep()
  const navigate = useNavigate()
  const syncCircle = useCircleSync()

  // Upgrade just completed: refresh the profile + circle caches so the rest of
  // the app sees the new Plus role, default credit limit, and the circle that
  // was filled during KYC — without this the loan gate keeps a stale snapshot
  // ("Waiting on 2 Circle members") even though the circle now qualifies.
  useEffect(() => {
    syncCircle()
  }, [syncCircle])

  const { isLoading, data, isError } = useQuery({
    queryKey: [getPatientCreditLimitKey],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_SUPERTOKENS_API_DOMAIN}/patients/credit-limit`
      )
      return response.data
    },
  })

  if (isLoading) {
    return <LoadingPage />
  }
  if (isError) {
    return <ErrorBlock message="Failed to load membership success data" />
  }

  const { totalCreditLimitAmount, currency } = data?.creditLimit || {}

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="Membership"
      isRoot
      headerIcon={
        <img src={successImage} alt="" className={HERO_ILLUSTRATION} />
      }
      pageTitle="Profile Completed!"
      description="Your updated loan limit is:"
    >
      <div className="flex flex-col items-center gap-5">
        <p className="text-2xl font-medium">
          {formatMoney(totalCreditLimitAmount, currency?.code)}
        </p>

        <Button
          role="link"
          onClick={() => navigate(next)}
          className="w-full  mt-5"
          size="lg"
        >
          Continue
        </Button>
      </div>
    </PatientPageWrapper>
  )
}
