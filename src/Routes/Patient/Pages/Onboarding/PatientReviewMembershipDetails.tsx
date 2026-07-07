import { useLocation, useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { DetailsNotSet } from "../../components/DetailsNotSet"
import { Button } from "@/components/Button"
import { useForm } from "react-hook-form"
import { useMutation } from "@tanstack/react-query"
import { useToast } from "@/hooks/useToast"
import axios from "axios"
import useNextMembershipSetupStep from "../../hooks/useNextMembershipSetupStep"
import { healthcareFocusAreas } from "../Onboarding/PatientHealthcareFocus"
import cashIcon from "@/assets/icons/cash.png"
import { insuranceProviderOptions } from "./PatientSelectInsurance"

type Inputs = {
  insuranceProviders: any[]
  favoriteCareProviders: any[]
  circleMembers: any[]
  plan?: string
}

export const patientMembershipStorageKey = "patient-review-membership-details"

export default function PatientReviewMembershipDetails() {
  const location = useLocation()
  const state = location.state
  const navigate = useNavigate()

  const { handleSubmit } = useForm<Inputs>()

  const { toast } = useToast()
  const next = useNextMembershipSetupStep()
  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = {
        plan: data.plan,
        skipCreditLimitUpdate: data.skipCreditLimitUpdate
      }
      
      if (data.plan === "FREE") {
         delete payload.plan
      }

      const response = await axios.post(
        import.meta.env.VITE_API_BASE_URL +
          "/patients/submit-plan-details",
        payload
      )

      return response.data
    },
    onSuccess: (data: any) => {
      if (data.authorizationUrl) {
        window.location.assign(data.authorizationUrl)
        return
      }

      navigate(next, {
        state,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      })
    },
  })

  const {
    insuranceProviders,
    favoriteCareProviders,
    circleMembers,
    financialStatements,
    skipCreditLimitUpdate,
    focusAreas,
    plan,
  } = state || {}

  if (!favoriteCareProviders || !circleMembers || !focusAreas || !state) {
    return (
      <DetailsNotSet title="It looks like you have not set some details yet" />
    )
  }

  const focusAreaTitles = healthcareFocusAreas
    .filter((area) => focusAreas.includes(area.value))
    .map((area) => area.name)

  const focusAreaOther =
    focusAreaTitles.length < focusAreas.length
      ? focusAreas[focusAreas.length - 1]
      : null

  const insuranceProviderTitles = insuranceProviderOptions
    .filter((area: any) => insuranceProviders.includes(area.value))
    .map((area: any) => area.name)

  const insuranceOther =
    insuranceProviderTitles.length < insuranceProviders.length
      ? insuranceProviders[insuranceProviders.length - 1]
      : null

  return (
    <PatientPageWrapper title="Review & Submit">
      <form
        className="flex flex-col gap-5 w-full"
        onSubmit={handleSubmit(() => {
          mutation.mutate(state)
        })}
      >
        <ReviewSection title="Your Insurance Providers">
          {insuranceProviderTitles.map((provider: any) => (
            <ReviewItem key={provider} title={provider} />
          ))}
          {/* Display other */}
          {insuranceProviderTitles.length < insuranceProviders && (
            <ReviewItem
              key={insuranceProviders.at(-1)}
              title={insuranceProviders.at(-1)}
            />
          )}
          {insuranceOther && (
            <ReviewItem key={insuranceOther} title={insuranceOther} />
          )}
        </ReviewSection>

        <ReviewSection title="Your Preferred Care Providers">
          {favoriteCareProviders.map((provider: any) => (
            <ReviewItem
              key={provider.id}
              title={provider.name}
              description={`${provider.county} • ${provider.plotNumber}`}
            />
          ))}
        </ReviewSection>

        <ReviewSection title="Your Circle ">
          {circleMembers.map((member: any, index: number) => (
            <ReviewItem
              key={index}
              title={`${member.firstName} ${member.lastName}`}
              description={member.phoneNumber}
              tag={member.relationship}
            />
          ))}
        </ReviewSection>

        <ReviewSection title="Your Health Coverage Priorities">
          {focusAreaTitles.map((area, index) => (
            <ReviewItem key={index} title={area} />
          ))}
          {focusAreaOther && (
            <ReviewItem key={focusAreas.at(-1)} title={focusAreas.at(-1)} />
          )}
        </ReviewSection>

        {!skipCreditLimitUpdate && financialStatements?.length > 0 && (
          <ReviewSection title="Your M-Pesa Statement">
            <div className="rounded-md p-3">
              {financialStatements[0].fileName}
            </div>
          </ReviewSection>
        )}

        {plan === "JIREH_PLUS" && <BasicPlanInfo />}

        <Button
          disabled={mutation.isPending || mutation.isSuccess}
          className="w-full"
          isLoading={mutation.isPending}
          type="submit"
        >
          {plan === "JIREH_PLUS" ? "Pay" : "Submit"}
        </Button>
        <Button
          className="w-full "
          variant="outline"
          onClick={(e) => {
            e.preventDefault()
            navigate(-1)
          }}
          disabled={mutation.isPending || mutation.isSuccess}
        >
          Back
        </Button>
      </form>
    </PatientPageWrapper>
  )
}

function ReviewSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2 pb-4 border-b">
      <h1 className="text-muted-foreground mb-2">{title}</h1>

      {children}
    </section>
  )
}

function ReviewItem({
  title,
  description,
  tag,
}: {
  title: string
  description?: string
  tag?: string
}) {
  return (
    <div className="flex justify-between items-center gap-1 bg-muted px-3  py-2 rounded-xl">
      <div className="grid gap-1">
        <p className="text-muted-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      {tag && (
        <span className="rounded-full border border-border text-xs grid place-content-center px-3 h-fit py-1">
          {tag}
        </span>
      )}
    </div>
  )
}

function BasicPlanInfo() {
  return (
    <div className="flex flex-col gap-2 bg-brand-gradient-100 rounded-xl p-4 items-center text-center">
      <img
        src={cashIcon}
        alt="cash icon"
        className="w-full max-w-[70px] object-contain"
        aria-hidden="true"
      />

      <p className="text-center text-2xl font-medium">
        Pay KES 499 to access interest-free credit
      </p>

      <p className="text-muted-foreground">
        Get immediate access to funds to cover your hospital bills
      </p>
    </div>
  )
}
