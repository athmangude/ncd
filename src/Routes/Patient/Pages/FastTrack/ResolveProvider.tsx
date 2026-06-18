import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import * as amplitude from "@amplitude/analytics-browser"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/InputOtp"
import PatientPageWrapper from "../PatientPageWrapper"
import { Button } from "@/components/Button"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS } from "@/analytics"
import { resolveProvider } from "./api"
import { useFastTrackStore } from "./useFastTrackStore"
import type { FastTrackPaymentPoint } from "./types"
import { formatPaymentNumber } from "./formatters"
import { ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import resolveProviderIllustration from "@/assets/images/resolve-provider-Illustration.png"
export default function ResolveProvider() {
  const navigate = useNavigate()
  const { toast } = useToast()

  useEffect(() => {
    trackEvent(EVENTS.FAST_TRACK_PAYMENT.RESOLVE_PROVIDER_VIEW)
  }, [])

  const paymentNumber = useFastTrackStore((s) => s.paymentNumber)
  const setPaymentNumber = useFastTrackStore((s) => s.setPaymentNumber)
  const storedProvider = useFastTrackStore((s) => s.provider)
  const setStoredProvider = useFastTrackStore((s) => s.setProvider)
  const setInvoiceNumber = useFastTrackStore((s) => s.setInvoiceNumber)
  const setInvoiceAmount = useFastTrackStore((s) => s.setInvoiceAmount)

  const {
    mutate,
    data: resolvedProvider,
    isPending,
    isError,
    error,
    reset,
  } = useMutation({
    mutationFn: (pn: string) => resolveProvider(pn),
    onSuccess: (data) => {
      setStoredProvider(data)
      trackEvent(EVENTS.FAST_TRACK_PAYMENT.PAYMENT_POINT_VIEWED, {
        payment_point_id: data.id,
        facility_id: data.facility?.id,
        discovery_source: "manual_pay_number",
        session_id: amplitude.getSessionId(),
      })
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || "Could not find that payment number"
      toast({ title: "Error", description: message, variant: "destructive" })
    },
  })

  const providerData = resolvedProvider ?? storedProvider

  function handlePaymentNumberChange(value: string) {
    setPaymentNumber(value)
    if (providerData || isError) {
      setStoredProvider(null)
      reset()
    }
    // Clear downstream invoice fields so they never carry over to the next step.
    setInvoiceNumber("")
    setInvoiceAmount("")
    // Auto-resolve the moment the user completes all 6 digits — no button click needed.
    if (value.length === 6) {
      mutate(value)
    }
  }

  function handleContinue(_provider: FastTrackPaymentPoint) {
    setStoredProvider(_provider)
    navigate("/patients/fast-track/payment-details")
  }

  return (
    <PatientPageWrapper title="Payment Details">
      <div className="flex flex-col gap-6 px-4 sm:px-6">
        <div className="flex flex-col items-center text-center gap-2 mt-2">
        {/* Hero illustration placeholder */}
        <div className="w-full h-48 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-400 font-medium overflow-hidden">
          {/* We use a placeholder since actual image paths depend on the bundler */}
          <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
            {/* Illustration Placeholder */}
            <img src={resolveProviderIllustration} alt="Resolve Provider" />
          </div>
        </div>
          <h2 className="text-xl font-semibold text-neutral-900">
          Enter the hospital's payment details
          </h2>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center">
              <div className="relative flex h-11 w-7 sm:h-12 sm:w-10 items-center justify-center border-y border-l border-r border-input text-sm sm:text-base font-semibold shadow-sm rounded-l-md bg-muted text-muted-foreground cursor-not-allowed select-none">J</div>
              <div className="relative flex h-11 w-7 sm:h-12 sm:w-10 items-center justify-center border-y border-r border-input text-sm sm:text-base font-semibold shadow-sm rounded-r-md bg-muted text-muted-foreground cursor-not-allowed select-none">H</div>
            </div>
            <InputOTPSeparator />
            <InputOTP
              maxLength={6}
              value={paymentNumber}
              onChange={handlePaymentNumberChange}
              pattern={REGEXP_ONLY_DIGITS}
              type="text"
              containerClassName="gap-1 sm:gap-2"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-11 w-7 sm:h-12 sm:w-10 text-sm sm:text-base font-semibold" />
                <InputOTPSlot index={1} className="h-11 w-7 sm:h-12 sm:w-10 text-sm sm:text-base font-semibold" />
                <InputOTPSlot index={2} className="h-11 w-7 sm:h-12 sm:w-10 text-sm sm:text-base font-semibold" />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} className="h-11 w-7 sm:h-12 sm:w-10 text-sm sm:text-base font-semibold" />
                <InputOTPSlot index={4} className="h-11 w-7 sm:h-12 sm:w-10 text-sm sm:text-base font-semibold" />
                <InputOTPSlot index={5} className="h-11 w-7 sm:h-12 sm:w-10 text-sm sm:text-base font-semibold" />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 flex-shrink-0 animate-spin" />
              <span>Confirming payment number…</span>
            </div>
          )}

          {isError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                {(error as any)?.response?.data?.message ||
                  "Payment number not found or inactive"}
              </span>
            </div>
          )}


        </div>

        {providerData && (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="border  rounded-xl p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span>
                    Facility :
                  </span>
                  <p className="text-base text-neutral-900 text-right">
                    {providerData?.facility?.name}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <span>
                    Payment Station :
                  </span>
                  <p className="text-base text-neutral-900 text-right">
                    {providerData.name}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <span>
                    Payment Number :
                  </span>
                  <p className="text-base text-neutral-900 text-right">
                    {formatPaymentNumber(providerData.paymentNumber)}
                  </p>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => handleContinue(providerData)}
            >
              <span className="flex items-center gap-1">
                Proceed to pay here <ChevronRight className="w-4 h-4" />
              </span>
            </Button>
          </div>
        )}
          {!providerData && (

        <div className="mt-6 pt-6">
        <div className="flex flex-col items-center text-neutral-500">
            <span>Don't have code ?</span>
          </div>
          <button
            type="button"
            onClick={() =>
              navigate("/patients/payment/request-payment/how-to-pay")
            }
            className="w-full flex items-center justify-center gap-4 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm hover:border-neutral-300 hover:shadow-md transition-all group"
          >

              <p className="text-sm text-neutral-500 mt-0.5 text-center">
              Search by hospital name and location
              </p>
          </button>
        </div>
      )}


      </div>
    </PatientPageWrapper>
  )
}
