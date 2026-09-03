import { useNavigate, useSearchParams } from "react-router-dom"
import { patientTransactionResultQueryKey } from "../Payment/PatientTransactionResult"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import QueryWrapper from "@/components/QueryBlock"
import { Button } from "@/components/Button"
import AppShell from "@/Routes/AppShell"
import fullLogo from "@/assets/icons/full-logo.svg"
import rewardIcon from "@/assets/icons/reward.png"
import { ChevronRight } from "lucide-react"

export default function PatientSubscriptionsTransactionResult() {
  const [params] = useSearchParams()

  const reference = params.get("reference")

  const query = useQuery({
    queryKey: [patientTransactionResultQueryKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("reference", reference)
        .single()

      if (error) throw error

      return {
        subscription: {
          plan: String((data as Record<string, unknown>)?.plan ?? "PLUS"),
        },
      }
    },
  })

  const navigate = useNavigate()

  const { subscription } = query.data || {}

  // Self-shells via AppShell (Phase 5): the legacy padded container in
  // PatientsHome has been removed, so this screen draws its own canonical frame.
  // The bespoke brand-gradient tint and the plain "Continue" CTA are preserved
  // verbatim (relocate, not restyle): the CTA moves from a `fixed bottom-0` bar
  // into the footer slot, the centered logo into the header slot.
  return (
    <QueryWrapper isLoading={query.isLoading} error={query.error}>
      <AppShell
        header={
          <div className="w-full flex justify-center pt-4">
            <img src={fullLogo} alt="Jireh Health" className="h-8" />
          </div>
        }
        footer={
          <div className="p-4 bg-brand-gradient-100">
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
        }
        bodyPadding="none"
        cardClassName="bg-brand-gradient-100"
      >
        <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
          <div className="flex flex-col items-center max-w-xs w-full">
            <div className="mb-8 relative">
              <img
                src={rewardIcon}
                alt="Upgrade Complete"
                className="w-28 h-28 object-contain"
              />
            </div>

            <h1 className="text-foreground mb-3">Payment complete!</h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              You have successfully signed up for JIREH{" "}
              {subscription?.plan?.toUpperCase()}
            </p>
          </div>
        </div>
      </AppShell>
    </QueryWrapper>
  )
}
