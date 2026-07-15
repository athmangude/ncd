import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useMutation, useQuery } from "@tanstack/react-query"
import * as amplitude from "@amplitude/analytics-browser"
import axios from "axios"
import { format } from "date-fns"
import PatientPageWrapper from "../PatientPageWrapper"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS, safeAmount } from "@/analytics"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import PatientDependentSelect from "../../components/PatientDependentSelect"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { patientConnectionsQueryKey } from "../Loans/RequestLoan/PatientSelectPatient"
import { useFastTrackStore } from "./useFastTrackStore"
import { verifyInvoice } from "./api"
import { FileText, ChevronRight, Loader2, Check, Trash2 } from "lucide-react"
import { formatMoney } from "@/utilities/currencyUtilities"
import { CashbackBanner } from "@/components/CashbackBanner"
import Tag from "@/components/Tag"
import FormGroupInput from "@/components/form/FormGroupInput"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/InputGroup"
import { DiscountDetailsDrawer } from "../../components/DiscountDetailsDrawer"
import { useEligibleDiscountCodes } from "../Dashboard/hooks/useEligibleDiscountCodes"
import type { DiscountCode } from "../Dashboard/components/DiscountsSection"
import percentTile from "@/assets/icons/percent-tile.png"

type DiscountCodeResponse = {
  isValid: boolean
  discountAmount: string
  message?: string
  discount?: DiscountCode
}

export interface SelectedPatient {
  id: string
  firstName: string
  lastName: string
  phoneNumber?: string
  status: string
}

const MIN_BILL_AMOUNT = 150

export default function PaymentDetails() {
  const navigate = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user } = usePatientAuthStore() as { user: any }

  useEffect(() => {
    trackEvent(EVENTS.FAST_TRACK_PAYMENT.PAYMENT_DETAILS_VIEW)
  }, [])

  const provider = useFastTrackStore((s) => s.provider)
  const invoiceNumber = useFastTrackStore((s) => s.invoiceNumber)
  const setInvoiceNumber = useFastTrackStore((s) => s.setInvoiceNumber)
  const invoiceAmount = useFastTrackStore((s) => s.invoiceAmount)
  const setInvoiceAmount = useFastTrackStore((s) => s.setInvoiceAmount)
  const selectedPatientId =
    useFastTrackStore((s) => s.selectedPatientId) || user?.id || ""
  const setSelectedPatientId = useFastTrackStore((s) => s.setSelectedPatientId)
  const setPatient = useFastTrackStore((s) => s.setPatient)

  // Returning from "Add patient" preselects the person who was just added.
  useEffect(() => {
    const preselected = (location.state as { preselectedPatientId?: string })
      ?.preselectedPatientId
    if (preselected) {
      setSelectedPatientId(preselected)
    }
  }, [location.state, setSelectedPatientId])

  const connectionsQuery = useQuery({
    queryKey: [patientConnectionsQueryKey],
    queryFn: async () => {
      const response = await axios.get(
        import.meta.env.VITE_SUPERTOKENS_API_DOMAIN +
          "/patient-network/connections"
      )
      return response.data
    },
  })

  const patientOptions = useMemo(() => {
    const selfOption = {
      name: `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
      value: user?.id,
      status: "SELF",
      phoneNumber: user?.phoneNumber || "",
      photo: user?.idVerification?.photo || "",
    }

    const connections = connectionsQuery.data?.patients || []
    return [selfOption, ...connections]
  }, [user, connectionsQuery.data])

  const selectedPatient = useMemo(() => {
    if (!selectedPatientId) return null
    const match = patientOptions.find((p: any) => p.value === selectedPatientId)
    if (!match) return null
    return {
      id: match.value,
      firstName: match.firstName || match.name?.split(" ")[0] || "",
      lastName:
        match.lastName || match.name?.split(" ").slice(1).join(" ") || "",
      phoneNumber: match.phoneNumber,
      status: match.status,
    } as SelectedPatient
  }, [selectedPatientId, patientOptions])

  const [isVerifying, setIsVerifying] = useState(false)
  const [invoiceFieldError, setInvoiceFieldError] = useState<string | null>(
    null
  )

  const parsedAmount = useMemo(() => {
    const n = parseFloat(invoiceAmount)
    return isNaN(n) ? 0 : n
  }, [invoiceAmount])

  const discountCode = useFastTrackStore((s) => s.discountCode)
  const setDiscountCode = useFastTrackStore((s) => s.setDiscountCode)
  const discountAmountStr = useFastTrackStore((s) => s.discountAmount)
  const setDiscountAmount = useFastTrackStore((s) => s.setDiscountAmount)
  const discountAmount = parseFloat(discountAmountStr) || 0

  const [discountCodeInput, setDiscountCodeInput] = useState("")
  const [appliedDiscount, setAppliedDiscount] =
    useState<DiscountCodeResponse | null>(() => {
      return discountAmountStr && discountCode
        ? {
            isValid: true,
            discountAmount: discountAmountStr,
            message: "Discount code applied",
          }
        : null
    })
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountCode | null>(
    null
  )
  const [isDiscountDrawerOpen, setIsDiscountDrawerOpen] = useState(false)

  const { data: eligibleDiscounts } = useEligibleDiscountCodes(!appliedDiscount)

  // "Eligible" from the API only means active/valid app-wide — it doesn't
  // know this bill's amount. Filter out codes the current bill can't
  // actually use (minimumOrderAmount) so the browsable list never offers a
  // code that would just bounce the user back out of the drawer.
  const usableDiscounts = useMemo(() => {
    if (!eligibleDiscounts) return []
    return eligibleDiscounts.filter((discount) => {
      const minimum = Number(discount.minimumOrderAmount)
      if (Number.isNaN(minimum) || minimum <= 0) return true
      return parsedAmount >= minimum
    })
  }, [eligibleDiscounts, parsedAmount])

  const validateDiscountCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const facilityId = provider?.facility?.id
      const payload: Record<string, unknown> = {
        code: code.toUpperCase().trim(),
        orderAmount: parsedAmount,
        userId: user?.id,
      }
      if (facilityId != null) {
        payload.healthcareFacilityId = facilityId
      }
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/discount-codes/validate`,
        payload,
        { withCredentials: true }
      )
      return (response.data.data || response.data) as DiscountCodeResponse
    },
    onSuccess: (data: DiscountCodeResponse, code: string) => {
      setAppliedDiscount(data)
      setIsDiscountDrawerOpen(false)
      const trackingProps = {
        discount_code: code.toUpperCase().trim(),
        payment_point_id: provider?.id,
        facility_id: provider?.facility?.id,
      }
      if (data.isValid) {
        setDiscountCode(code.toUpperCase().trim())
        setDiscountAmount(data.discountAmount)
        setDiscountCodeInput("")
        toast({
          title: "Discount Applied",
          description: data.message || "Discount code applied successfully",
        })
        trackEvent(EVENTS.FAST_TRACK_PAYMENT.DISCOUNT_CODE_APPLIED, {
          ...trackingProps,
          discount_amount: safeAmount(data.discountAmount),
        })
      } else {
        setDiscountCode("")
        setDiscountAmount("0")
        toast({
          title: "Invalid Code",
          description: data.message || "This discount code is not valid",
          variant: "destructive",
        })
        trackEvent(EVENTS.FAST_TRACK_PAYMENT.DISCOUNT_CODE_REJECTED, {
          ...trackingProps,
          reason: data.message,
        })
      }
    },
    onError: (error: any) => {
      setAppliedDiscount(null)
      setDiscountCode("")
      setDiscountAmount("0")
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to validate discount code",
        variant: "destructive",
      })
    },
  })

  const handleRemoveDiscount = () => {
    trackEvent(EVENTS.FAST_TRACK_PAYMENT.DISCOUNT_CODE_REMOVED, {
      discount_code: discountCode,
    })
    setDiscountCode("")
    setDiscountAmount("0")
    setDiscountCodeInput("")
    setAppliedDiscount(null)
  }

  // Re-validate an already-applied discount when the bill amount changes —
  // the discount amount, and eligibility itself (minimumOrderAmount), depend
  // on it. Debounced so it doesn't refire on every keystroke.
  const lastValidatedAmountRef = useRef<number>(0)
  useEffect(() => {
    if (
      discountCode &&
      appliedDiscount?.isValid &&
      parsedAmount > 0 &&
      parsedAmount !== lastValidatedAmountRef.current
    ) {
      lastValidatedAmountRef.current = parsedAmount
      const timeoutId = setTimeout(() => {
        validateDiscountCodeMutation.mutate(discountCode)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
    // Deliberate single-trigger on bill-amount change; lastValidatedAmountRef prevents recursion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedAmount])

  async function handleContinue() {
    if (!provider) return

    if (!invoiceNumber.trim()) {
      setInvoiceFieldError("Please enter an invoice number")
      return
    }
    if (parsedAmount < MIN_BILL_AMOUNT) {
      toast({
        title: "Invalid amount",
        description: `Invoice amount must be at least KES ${MIN_BILL_AMOUNT}`,
        variant: "destructive",
      })
      return
    }
    if (!selectedPatient) {
      toast({
        title: "Missing field",
        description: "Please select a patient",
        variant: "destructive",
      })
      return
    }

    const facilityId = provider.facility?.id
    if (!facilityId) {
      toast({
        title: "Error",
        description:
          "Could not determine the healthcare facility. Please go back and re-enter the payment number.",
        variant: "destructive",
      })
      return
    }

    setInvoiceFieldError(null)
    setIsVerifying(true)
    try {
      const result = await verifyInvoice(invoiceNumber.trim(), facilityId)

      if (result.exists) {
        setInvoiceFieldError(
          `Invoice "${invoiceNumber.trim()}" has already been submitted to ${result.facilityName}. Please use a different invoice number.`
        )
        return
      }

      trackEvent(EVENTS.FAST_TRACK_PAYMENT.PAYMENT_INITIATED, {
        payment_point_id: provider?.id,
        facility_id: provider?.facility?.id,
        amount_attempted: safeAmount(invoiceAmount),
        currency: "KES",
        patient_id: selectedPatient?.id,
        entry_channel: "manual_pay_number",
        session_id: amplitude.getSessionId(),
      })

      setPatient(selectedPatient)
      navigate("/patients/fast-track/wallet-selection")
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Unable to verify invoice. Please try again."
      setInvoiceFieldError(message)
    } finally {
      setIsVerifying(false)
    }
  }

  if (connectionsQuery.isLoading) {
    return <LoadingPage />
  }

  if (connectionsQuery.isError) {
    return <ErrorBlock />
  }

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="Payment details"
      pageTitle="Fill these details from your invoice."
      description="You might need to ask the cashier for your invoice if one is not provided to you."
      primaryCta={{
        label: (
          <span className="flex items-center gap-1">
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Choose Payment Method <ChevronRight className="w-4 h-4" />
              </>
            )}
          </span>
        ),
        onClick: handleContinue,
        disabled:
          !invoiceNumber.trim() ||
          parsedAmount < MIN_BILL_AMOUNT ||
          !selectedPatient ||
          isVerifying,
      }}
    >
      <div className="flex flex-col gap-5 px-1 pb-8">
        {/* Invoice Number */}
        <FormGroupInput
          id="invoiceNumber"
          label="Invoice Number"
          type="text"
          prefix={<FileText className="w-4 h-4" />}
          value={invoiceNumber}
          onChange={(e) => {
            setInvoiceFieldError(null)
            setInvoiceNumber(e.target.value)
          }}
          error={invoiceFieldError ?? undefined}
        />

        {/* Beneficiary (Patient Selection) */}
        <PatientDependentSelect
          id="fastTrackPatient"
          label="Who is the patient today?"
          placeholder=""
          items={patientOptions}
          field={{
            value: selectedPatientId,
            onChange: (val: string) => setSelectedPatientId(val),
          }}
          error={undefined}
          defaultValue={user?.id || ""}
          action={{
            fn: () => {
              navigate("/patients/network/add-connection", {
                state: { from: "fast-track-payment-details" },
              })
            },
            label: "Add patient",
          }}
        />
        {/* Invoice Amount */}
        <FormGroupInput
          id="invoiceAmount"
          label="Total Bill Amount"
          type="number"
          inputMode="decimal"
          prefix="KES"
          value={invoiceAmount}
          onKeyDown={(e) => {
            if (e.key === "-" || e.key === "e" || e.key === "E") {
              e.preventDefault()
            }
          }}
          onChange={(e) => {
            const value = e.target.value
            if (value.startsWith("-")) return
            setInvoiceAmount(value)
          }}
          error={
            invoiceAmount !== "" &&
            parsedAmount > 0 &&
            parsedAmount < MIN_BILL_AMOUNT
              ? `Minimum bill amount is KES ${MIN_BILL_AMOUNT}`
              : undefined
          }
        />

        {parsedAmount >= MIN_BILL_AMOUNT && (
          <CashbackBanner
            visible={true}
            title="Pay the full bill via Jireh and earn!"
            description={`With a bill of ${formatMoney(parsedAmount, "KES")}, you could earn up to ${formatMoney(parsedAmount * 0.05, "KES")} cashback!`}
          />
        )}

        {/* Discount Code — resolved before payment-method allocation (step 3)
            so the amount to pay is final by the time wallets are chosen. */}
        {parsedAmount >= MIN_BILL_AMOUNT && (
          <div className="flex flex-col gap-2">
            {appliedDiscount?.isValid ? (
              <div className="border border-border rounded-xl p-3 flex items-center gap-3">
                <img
                  src={percentTile}
                  alt=""
                  aria-hidden="true"
                  className="w-10 h-10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2 font-mono">
                    {discountCode}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appliedDiscount.message || "Discount code applied"}
                  </p>
                </div>
                <Tag variant="success" className="shrink-0">
                  <Check className="w-3 h-3" />
                  {formatMoney(discountAmount, "KES")} OFF
                </Tag>
                <button
                  type="button"
                  aria-label="Remove discount code"
                  onClick={handleRemoveDiscount}
                  className="shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="discountCode"
                  className="text-sm font-medium text-foreground"
                >
                  Discount Code (Optional)
                </label>
                <InputGroup>
                  <InputGroupInput
                    id="discountCode"
                    type="text"
                    value={discountCodeInput}
                    onChange={(e) => {
                      setDiscountCodeInput(e.target.value.toUpperCase().trim())
                      setAppliedDiscount(null)
                    }}
                    placeholder="Enter discount code"
                  />
                  <InputGroupAddon align="inline-end">
                    {validateDiscountCodeMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    <InputGroupButton
                      variant="outline"
                      onClick={() => {
                        if (discountCodeInput.trim()) {
                          validateDiscountCodeMutation.mutate(discountCodeInput)
                        }
                      }}
                      disabled={
                        !discountCodeInput.trim() ||
                        validateDiscountCodeMutation.isPending
                      }
                    >
                      Apply
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                {appliedDiscount && !appliedDiscount.isValid && (
                  <p className="text-xs text-red-600">
                    {appliedDiscount.message}
                  </p>
                )}

                {usableDiscounts.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                    {usableDiscounts.map((discount) => (
                      <button
                        key={discount.id}
                        type="button"
                        onClick={() => {
                          setSelectedDiscount(discount)
                          setIsDiscountDrawerOpen(true)
                          trackEvent(
                            EVENTS.FAST_TRACK_PAYMENT.DISCOUNT_CODE_VIEWED,
                            {
                              discount_code: discount.code,
                            }
                          )
                        }}
                        className="border border-border rounded-xl p-2.5 text-left flex items-center gap-2.5 shrink-0 w-[190px]"
                      >
                        <img
                          src={percentTile}
                          alt=""
                          aria-hidden="true"
                          className="w-8 h-8 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground line-clamp-1">
                            {discount.description}
                          </p>
                          {discount.maximumDiscountAmount && (
                            <p className="text-xs text-muted-foreground">
                              up to {discount.currency.symbol}{" "}
                              {parseFloat(
                                discount.maximumDiscountAmount
                              ).toLocaleString()}
                            </p>
                          )}
                          {!discount.maximumDiscountAmount &&
                            discount.validUntil && (
                              <p className="text-xs text-muted-foreground">
                                Valid until{" "}
                                {format(new Date(discount.validUntil), "d MMM")}
                              </p>
                            )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DiscountDetailsDrawer
          discount={selectedDiscount}
          open={isDiscountDrawerOpen}
          onOpenChange={setIsDiscountDrawerOpen}
          onApply={
            selectedDiscount
              ? () => validateDiscountCodeMutation.mutate(selectedDiscount.code)
              : undefined
          }
        />
      </div>
    </PatientPageWrapper>
  )
}
