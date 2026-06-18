import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import * as amplitude from "@amplitude/analytics-browser"
import axios from "axios"
import PatientPageWrapper from "../PatientPageWrapper"
import { Button } from "@/components/Button"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS, safeAmount } from "@/analytics"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import PatientDependentSelect from "../../components/PatientDependentSelect"
import LoadingPage from "@/Routes/LoadingPage"
import ErrorBlock from "@/components/ErrorBlock"
import { patientConnectionsQueryKey } from "../Loans/RequestLoan/PatientSelectPatient"
import { useFastTrackStore } from "./useFastTrackStore"
import { verifyInvoice } from "./api"
import {
  FileText,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { formatMoney } from "@/utilities/currencyUtilities"
import { CashbackBanner } from "@/components/CashbackBanner"
import ErrorMessage from "@/components/ErrorMessage"
import { cn } from "@/lib/utils"

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
  const selectedPatientId = useFastTrackStore((s) => s.selectedPatientId) || user?.id || ""
  const setSelectedPatientId = useFastTrackStore((s) => s.setSelectedPatientId)
  const setPatient = useFastTrackStore((s) => s.setPatient)

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
    const match = patientOptions.find(
      (p: any) => p.value === selectedPatientId
    )
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
        description: "Could not determine the healthcare facility. Please go back and re-enter the payment number.",
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
    <PatientPageWrapper title="Payment Details">
      <div className="flex flex-col gap-5 px-1 pb-8">
        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <h2 className="text-xl font-semibold text-neutral-900">
            Fill these details from your invoice.
          </h2>
          <p className="text-sm text-neutral-500 max-w-xs">
            You might need to ask the cashier for your invoice if one is not provided to you.
          </p>
        </div>

        {/* Invoice Number */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="invoiceNumber"
            className="text-sm font-medium text-neutral-700"
          >
            Invoice Number
          </label>
          <div className="relative">
            <FileText
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                invoiceFieldError ? "text-red-400" : "text-neutral-400"
              )}
            />
            <input
              id="invoiceNumber"
              type="text"
              value={invoiceNumber}
              onChange={(e) => {
                setInvoiceFieldError(null)
                setInvoiceNumber(e.target.value)
              }}
              aria-invalid={invoiceFieldError ? true : undefined}
              aria-describedby={
                invoiceFieldError ? "invoiceNumber-error" : undefined
              }
              className={cn(
                "w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-all",
                invoiceFieldError
                  ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                  : "border-neutral-200 focus:ring-purple-500 focus:border-transparent"
              )}
            />
          </div>
          {invoiceFieldError ? (
            <div id="invoiceNumber-error">
              <ErrorMessage message={invoiceFieldError} />
            </div>
          ) : null}
        </div>

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
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="invoiceAmount"
            className="text-sm font-medium text-neutral-700"
          >
          Total Bill Amount
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-neutral-500">
              KES
            </span>
            <input
              id="invoiceAmount"
              type="number"
              inputMode="decimal"
              min={MIN_BILL_AMOUNT}
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
              className="w-full pl-14 pr-4 py-3 border border-neutral-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          {invoiceAmount !== "" &&
            parsedAmount > 0 &&
            parsedAmount < MIN_BILL_AMOUNT && (
              <ErrorMessage
                message={`Minimum bill amount is KES ${MIN_BILL_AMOUNT}`}
              />
            )}
        </div>

        {parsedAmount > 0 && (
          <CashbackBanner
          visible={true}
          title="Pay the full bill via Jireh and earn!"
          description={`With a bill of ${formatMoney(parsedAmount, "KES")}, you could earn up to ${formatMoney(parsedAmount * 0.05, "KES")} cashback!`}
        />
        )}

        {/* Continue */}
        <Button
          className="w-full mt-2"
          size="lg"
          onClick={handleContinue}
          disabled={
            !invoiceNumber.trim() ||
            parsedAmount < MIN_BILL_AMOUNT ||
            !selectedPatient ||
            isVerifying
          }
        >
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
        </Button>
      </div>
    </PatientPageWrapper>
  )
}
