import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import useNextMembershipSetupStep from "../../hooks/useNextMembershipSetupStep"
import { useCircleSync } from "../../hooks/useCircleSync"
import PatientPageWrapper from "../PatientPageWrapper"
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
    <PatientPageWrapper title="Profile Completed">
      <div className="flex flex-col items-center gap-5 mt-10">
        <img
          src={successImage}
          alt="membership success"
          className="aspect-square p-2 object-contain w-full max-w-[150px] mx-auto"
          aria-hidden="true"
        />

        <h1 className="text-2xl font-medium">Profile Completed!</h1>

        <p className="text-neutral-500">Your updated loan limit is: </p>
        <p className="text-2xl font-medium">
          {formatMoney(totalCreditLimitAmount, currency)}
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
