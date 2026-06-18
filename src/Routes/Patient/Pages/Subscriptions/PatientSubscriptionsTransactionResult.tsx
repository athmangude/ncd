import { useNavigate, useSearchParams } from "react-router-dom"
import { patientTransactionResultQueryKey } from "../Payment/PatientTransactionResult"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import QueryWrapper from "@/components/QueryBlock"
import { Button } from "@/components/Button"
import fullLogo from "@/assets/icons/full-logo.svg"
import rewardIcon from "@/assets/icons/reward.png"
import { ChevronRight } from "lucide-react"

export default function PatientSubscriptionsTransactionResult() {
  const [params] = useSearchParams()

  const reference = params.get("reference")

  const query = useQuery({
    queryKey: [patientTransactionResultQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          `/patients/payments/transaction-result/${reference}`
      )

      return response.data
    },
  })

  const navigate = useNavigate()

  const { subscription } = query.data || {}

  return (
    <QueryWrapper isLoading={query.isLoading} error={query.error}>
      <div className="min-h-screen bg-bubblegum-100 flex flex-col items-center px-6 py-10">
        <div className="w-full flex justify-center pt-4">
          <img src={fullLogo} alt="Jireh Health" className="h-8" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xs w-full">
          <div className="mb-8 relative">
            <img
              src={rewardIcon}
              alt="Upgrade Complete"
              className="w-28 h-28 object-contain"
            />
          </div>

          <h1 className="text-2xl font-semibold text-foreground mb-3">
            Payment complete!
          </h1>
          <p className="text-neutral-600 text-base leading-relaxed">
          You have successfully signed up for JIREH {subscription?.plan?.toUpperCase()}
          </p>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
        <div className="max-w-md mx-auto w-full">
          <Button
            className="w-full"
            size="lg"
            onClick={() =>
              navigate("/patients/membership-success", {
                state: {
                  plan: `JIREH_${subscription?.plan}`,
                },
              })
            }
            role="link"
          >
            Continue <ChevronRight className="ml-1 w-4 h-4" />
          </Button>
        </div>
        </div>
      </div>
    </QueryWrapper>
  )
}
