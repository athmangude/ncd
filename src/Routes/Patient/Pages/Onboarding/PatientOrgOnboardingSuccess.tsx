import { useQuery } from "@tanstack/react-query"
import PatientAuthWrapper from "../../components/PatientAuthWrapper"
import { supabase } from "@/lib/supabase"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import share from "@/assets/icons/share.png"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/Accordion"
import { BadgeCheck, UsersRound } from "lucide-react"
import { Button } from "@/components/Button"
import { useNavigate } from "react-router-dom"
import useNextMembershipSetupStep from "../../hooks/useNextMembershipSetupStep"

export const patientOrgDetailsQueryKey = "patientOrgDetails"

export function PatientOrgOnboardingSuccess() {
  const navigate = useNavigate()
  const next = useNextMembershipSetupStep()

  const query = useQuery({
    queryKey: [patientOrgDetailsQueryKey],
    queryFn: async () => {
      const { data: pd, error } = await supabase
        .from("patient_details")
        .select("data")
        .single()

      if (error) throw error

      const blob = (pd?.data ?? {}) as Record<string, unknown>
      const orgBorrower = blob.orgBorrower as Record<string, unknown> | null
      return {
        name: orgBorrower?.orgName ?? "Your organization",
        orgPlan: orgBorrower?.orgPlan ?? "ADVANCE",
      }
    },
  })

  if (query.isLoading) {
    return <LoadingPage />
  }
  if (query.isError) {
    return <ErrorBlock message={query.error.message} />
  }

  const { name, orgPlan } = (query.data ?? {}) as Record<string, any>
  const orgName = (name as string)?.trim() || "Your organization"

  return (
    <PatientAuthWrapper>
      <section className="text-center flex flex-col gap-7">
        <img
          src={share}
          alt="icon"
          className="aspect-square p-2 object-contain w-full max-w-[150px] mx-auto"
          aria-hidden="true"
        />

        <h1>{orgName} wants to make healthcare easier for you.</h1>

        <p className="text-muted-foreground">
          You've been added to a 0% interest plan that helps you get care now,
          and pay later.
        </p>

        {orgPlan === "ADVANCE" ? <EmployerFAQ /> : <SaccoFAQ />}

        <Button
          className="w-full "
          size="lg"
          role="link"
          onClick={() => navigate(next)}
        >
          Continue
        </Button>
      </section>
    </PatientAuthWrapper>
  )
}

export function EmployerFAQ() {
  return (
    <Accordion type="multiple" className="w-full flex flex-col gap-3">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <UsersRound className="w-5 h-5 text-muted-foreground" />
          What is a salary advance health plan?
        </AccordionTrigger>
        <AccordionContent>
          <p>
            It is a simple, instant and interest-free way for you and your loved
            ones to access medical care and pay later from your salary.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <BadgeCheck className="w-5 h-5 text-muted-foreground" />
          What are the benefits?
        </AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside">
            <li>0% interest loans</li>
            <li>Worry free payment plans through your employer</li>
            <li>Use at any care facility</li>
            <li>Funds for unexpected needs</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

export function SaccoFAQ() {
  return (
    <Accordion type="multiple" className="w-full flex flex-col gap-3">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <UsersRound className="w-5 h-5 text-muted-foreground" />
          How does this differ from Jireh loans?
        </AccordionTrigger>
        <AccordionContent>
          <p>
            To repay loans taken from your SACCO plan, use the SACCO
            app/paybill.
          </p>
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>
          <BadgeCheck className="w-5 h-5 text-muted-foreground" />
          What are the benefits?
        </AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside">
            <li>0% interest loans</li>
            <li>Worry free payment plans through your SACCO</li>
            <li>Use at any care facility</li>
            <li>Funds for unexpected needs</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
