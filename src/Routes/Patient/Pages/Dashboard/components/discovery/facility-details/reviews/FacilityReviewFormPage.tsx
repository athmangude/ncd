import { useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import PatientPageWrapper from "@/Routes/Patient/Pages/PatientPageWrapper"
import { Button } from "@/components/Button"
import { PrimaryCTAFooter } from "@/Routes/shell/footers"
import FormGroupTextarea from "@/components/form/FormGroupTextarea"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS } from "@/analytics"
import { useOffline } from "@/hooks/useOffline"
import { OfflinePlaceholder } from "@/components/OfflinePlaceholder"
import { Skeleton } from "@/components/Skeleton"
import { cn } from "@/lib/utils"
import { useFacilityDetails } from "./../useFacilityDetails"
import { useReviewEligibility } from "./useReviewEligibility"
import { useSubmitFacilityReview } from "./useSubmitFacilityReview"
import { NPS_SCORES } from "./npsScale"

const MAX_LEN = 500

type NpsBucket = "promoter" | "passive" | "detractor"

interface ReviewFormFields {
  lovedMost: string
  couldDoBetter: string
  makeItATen: string
}

function bucketForScore(score: number | null): NpsBucket | null {
  if (score === null || typeof score !== "number") return null
  if (score >= 9) return "promoter"
  if (score >= 7) return "passive"
  return "detractor"
}

export default function FacilityReviewFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isOffline = useOffline()
  const { toast } = useToast()

  const {
    data: facility,
    isLoading: facilityLoading,
    isError,
  } = useFacilityDetails(id)
  const { data: eligibility, isLoading: eligibilityLoading } =
    useReviewEligibility(id)
  const submit = useSubmitFacilityReview()

  const {
    register,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ReviewFormFields & { npsScore: number | null }>({
    defaultValues: {
      lovedMost: "",
      couldDoBetter: "",
      makeItATen: "",
      npsScore: null,
    },
  })

  const npsScore = watch("npsScore")
  const bucket = bucketForScore(npsScore)

  // When the user picks a score that lands in a different NPS band than the
  // previous one, clear any text they had typed for the prior band so we
  // never silently submit text the user can no longer see.
  const previousBucketRef = useRef<NpsBucket | null>(null)
  useEffect(() => {
    const prev = previousBucketRef.current
    if (prev !== null && bucket !== null && prev !== bucket) {
      setValue("lovedMost", "")
      setValue("couldDoBetter", "")
      setValue("makeItATen", "")
    }
    previousBucketRef.current = bucket
  }, [bucket, setValue])

  useEffect(() => {
    if (!facility || !eligibility?.unreviewedPaymentId) return
    trackEvent(EVENTS.DISCOVERY.FACILITY_REVIEW_FORM_VIEW, {
      facilityId: facility.id,
      paymentId: eligibility.unreviewedPaymentId,
    })
    // Intentionally narrowed to the specific fields read in the payload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facility?.id, eligibility?.unreviewedPaymentId])

  useEffect(() => {
    if (eligibilityLoading || !eligibility) return
    if (!eligibility.canReview && id) {
      navigate(`/patients/facility/${id}?tab=reviews`, { replace: true })
    }
    // Intentionally narrowed to canReview; the full eligibility object would re-fire on unrelated field changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eligibility?.canReview, eligibilityLoading, id, navigate])

  const canSubmit =
    npsScore !== null && typeof npsScore === "number" && !submit.isPending

  const handleScoreSelect = (score: number) => {
    setValue("npsScore", score, { shouldDirty: true })
    if (facility) {
      trackEvent(EVENTS.DISCOVERY.FACILITY_REVIEW_SCORE_SELECT, {
        facilityId: facility.id,
        score,
      })
    }
  }

  const onSubmit = async (data: ReviewFormFields) => {
    if (!facility || !id || npsScore === null || typeof npsScore !== "number")
      return
    if (!eligibility?.unreviewedPaymentId) return

    const activeBucket = bucketForScore(npsScore)
    const lovedMost = activeBucket === "promoter" ? data.lovedMost.trim() : ""
    const couldDoBetter =
      activeBucket === "detractor" ? data.couldDoBetter.trim() : ""
    const makeItATen = activeBucket === "passive" ? data.makeItATen.trim() : ""

    trackEvent(EVENTS.DISCOVERY.FACILITY_REVIEW_SUBMIT_TAP, {
      facilityId: facility.id,
      score: npsScore,
      bucket: activeBucket,
      lovedMostLength: lovedMost.length,
      couldDoBetterLength: couldDoBetter.length,
      makeItATenLength: makeItATen.length,
    })

    try {
      await submit.mutateAsync({
        facilityId: id,
        payload: {
          paymentId: eligibility.unreviewedPaymentId,
          npsScore,
          lovedMost: lovedMost.length > 0 ? lovedMost : undefined,
          couldDoBetter: couldDoBetter.length > 0 ? couldDoBetter : undefined,
          makeItATen: makeItATen.length > 0 ? makeItATen : undefined,
        },
      })

      trackEvent(EVENTS.DISCOVERY.FACILITY_REVIEW_SUBMIT_SUCCESS, {
        facilityId: facility.id,
        score: npsScore,
      })

      toast({
        title: "Thank you for your feedback",
      })
      navigate(`/patients/facility/${id}?tab=reviews`, { replace: true })
    } catch (err: any) {
      const errData = err?.response?.data
      const code: string = errData?.code ?? "UNKNOWN_ERROR"
      const message: string =
        errData?.message ?? "Something went wrong. Please try again."

      trackEvent(EVENTS.DISCOVERY.FACILITY_REVIEW_SUBMIT_ERROR, {
        facilityId: facility.id,
        errorCode: code,
      })

      if (!navigator.onLine) {
        toast({
          title: "You're offline",
          description: "Try again when you reconnect.",
        })
        return
      }
      toast({
        title: "Couldn't submit review",
        description: message,
      })
    }
  }

  if (isOffline) {
    return (
      <PatientPageWrapper hideHeader footer={null}>
        <OfflinePlaceholder message="Connect to the internet to leave a review." />
      </PatientPageWrapper>
    )
  }

  if (facilityLoading || eligibilityLoading) {
    return (
      <PatientPageWrapper hideHeader footer={null} bodyPadding="none">
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-5 w-40 bg-muted rounded" />
          <Skeleton className="h-32 w-full bg-muted rounded" />
        </div>
      </PatientPageWrapper>
    )
  }

  if (isError || !facility) {
    return (
      <PatientPageWrapper hideHeader footer={null} bodyPadding="none">
        <div className="flex flex-col items-center justify-center min-h-full p-6 gap-4">
          <p className="text-sm text-muted-foreground">
            Facility details are not available.
          </p>
          <Button onClick={() => navigate(-1)}>Back</Button>
        </div>
      </PatientPageWrapper>
    )
  }

  const footer = (
    <PrimaryCTAFooter
      type="submit"
      form="facility-review-form"
      disabled={!canSubmit}
      label={submit.isPending ? "Submitting…" : "Add a review"}
    />
  )

  return (
    <PatientPageWrapper
      title="Add a review"
      onBack={() => navigate(-1)}
      footer={footer}
      bodyPadding="none"
    >
      <form
        id="facility-review-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col bg-card"
      >
        <section className="px-6 py-6 flex flex-col items-center text-center">
          <p className="text-base font-semibold text-foreground max-w-[34ch]">
            How likely are you to recommend this provider to friends or family?
          </p>
          <p className="text-xs text-muted-foreground mt-2">0 → not at all</p>
          <p className="text-xs text-muted-foreground">10 → extremely likely</p>

          <div className="grid grid-cols-6 gap-2 mt-6 max-w-xs">
            {NPS_SCORES.map((score) => {
              const selected = npsScore === score
              const filled = typeof npsScore === "number" && score <= npsScore
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => handleScoreSelect(score)}
                  className={cn(
                    "h-10 w-10 rounded-full text-sm font-semibold transition-colors",
                    filled
                      ? "bg-teal-500 text-white"
                      : "bg-muted text-foreground hover:bg-muted/70"
                  )}
                  aria-pressed={selected}
                  aria-label={`Score ${score}`}
                >
                  {score}
                </button>
              )
            })}
          </div>
        </section>

        <section className="flex flex-col gap-4 px-6 pb-6">
          {bucket === "promoter" && (
            <div className="sensitive-data">
              <FormGroupTextarea
                id="lovedMost"
                label="What did you love most? (optional)"
                register={register("lovedMost", { maxLength: MAX_LEN })}
                error={errors.lovedMost ? "Too long" : undefined}
              />
            </div>
          )}
          {bucket === "passive" && (
            <div className="sensitive-data">
              <FormGroupTextarea
                id="makeItATen"
                label="What would make your experience a 10? (optional)"
                register={register("makeItATen", { maxLength: MAX_LEN })}
                error={errors.makeItATen ? "Too long" : undefined}
              />
            </div>
          )}
          {bucket === "detractor" && (
            <div className="sensitive-data">
              <FormGroupTextarea
                id="couldDoBetter"
                label={`How can ${facility.name} do better in future? (optional)`}
                register={register("couldDoBetter", { maxLength: MAX_LEN })}
                error={errors.couldDoBetter ? "Too long" : undefined}
              />
            </div>
          )}
        </section>
      </form>
    </PatientPageWrapper>
  )
}
