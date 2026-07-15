import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import * as amplitude from "@amplitude/analytics-browser"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/InputOtp"
import { Chip } from "@/components/Chip"
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
} from "@/components/Item"
import PatientPageWrapper from "../PatientPageWrapper"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS } from "@/analytics"
import { resolveProvider } from "./api"
import { useFastTrackStore } from "./useFastTrackStore"
import type { FastTrackPaymentPoint } from "./types"
import { formatPaymentNumber } from "./formatters"
import { ChevronRight, Search, AlertCircle, Loader2 } from "lucide-react"
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
    <PatientPageWrapper
      variant="content"
      barTitle="Payment details"
      pageTitle="Enter the hospital's payment details"
      headerAction={
        <Chip
          onClick={() =>
            navigate("/patients/payment/request-payment/how-to-pay")
          }
        >
          <Search className="w-4 h-4 shrink-0" />
          <span>Search by hospital name and location</span>
        </Chip>
      }
      primaryCta={
        providerData
          ? {
              label: (
                <span className="flex items-center gap-1">
                  Proceed to pay here <ChevronRight className="w-4 h-4" />
                </span>
              ),
              onClick: () => handleContinue(providerData),
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          {/* Hero illustration placeholder */}
          <div className="w-full bg-purple-100 rounded-2xl flex items-center justify-center text-purple-400 font-medium overflow-hidden">
            {/* We use a placeholder since actual image paths depend on the bundler */}
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
              {/* Illustration Placeholder */}
              <img src={resolveProviderIllustration} alt="Resolve Provider" />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center">
              <div className="relative flex h-11 w-9 sm:h-12 sm:w-10 items-center justify-center border-y border-l border-r border-input text-xl sm:text-xl font-semibold shadow-sm rounded-l-md bg-muted text-muted-foreground cursor-not-allowed select-none">
                J
              </div>
              <div className="relative flex h-11 w-9 sm:h-12 sm:w-10 items-center justify-center border-y border-r border-input text-xl sm:text-xl font-semibold shadow-sm rounded-r-md bg-muted text-muted-foreground cursor-not-allowed select-none">
                H
              </div>
            </div>
            <InputOTPSeparator />
            <InputOTP
              autoFocus
              maxLength={6}
              value={paymentNumber}
              onChange={handlePaymentNumberChange}
              pattern={REGEXP_ONLY_DIGITS}
              type="text"
              containerClassName="gap-1 sm:gap-2"
            >
              <InputOTPGroup>
                <InputOTPSlot
                  index={0}
                  className="h-11 w-9 sm:h-12 sm:w-10 text-xl sm:text-xl font-medium"
                />
                <InputOTPSlot
                  index={1}
                  className="h-11 w-9 sm:h-12 sm:w-10 text-xl sm:text-xl font-medium"
                />
                <InputOTPSlot
                  index={2}
                  className="h-11 w-9 sm:h-12 sm:w-10 text-xl sm:text-xl font-medium"
                />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot
                  index={3}
                  className="h-11 w-9 sm:h-12 sm:w-10 text-xl sm:text-xl font-medium"
                />
                <InputOTPSlot
                  index={4}
                  className="h-11 w-9 sm:h-12 sm:w-10 text-xl sm:text-xl font-medium"
                />
                <InputOTPSlot
                  index={5}
                  className="h-11 w-9 sm:h-12 sm:w-10 text-xl sm:text-xl font-medium"
                />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <ItemGroup className="border rounded-xl shadow-sm">
              <Item size="sm">
                <ItemContent>
                  <ItemTitle>Facility</ItemTitle>
                  <ItemDescription className="line-clamp-none text-foreground">
                    {providerData?.facility?.name}
                  </ItemDescription>
                </ItemContent>
              </Item>
              <ItemSeparator />
              <Item size="sm">
                <ItemContent>
                  <ItemTitle>Payment Station</ItemTitle>
                  <ItemDescription className="line-clamp-none text-foreground">
                    {providerData.name}
                  </ItemDescription>
                </ItemContent>
              </Item>
              <ItemSeparator />
              <Item size="sm">
                <ItemContent>
                  <ItemTitle>Payment Number</ItemTitle>
                  <ItemDescription className="line-clamp-none text-foreground">
                    {formatPaymentNumber(providerData.paymentNumber)}
                  </ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </div>
        )}
      </div>
    </PatientPageWrapper>
  )
}
