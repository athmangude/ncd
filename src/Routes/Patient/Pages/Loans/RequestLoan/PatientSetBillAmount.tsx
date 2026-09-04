import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import PatientPageWrapper from "../../PatientPageWrapper"
import { useLocation, useNavigate } from "react-router-dom"
import FormGroupInput from "@/components/form/FormGroupInput"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Button } from "@/components/Button"
import { usePersistentForm } from "@/hooks/usePersistentForm"
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "@/utilities/localStorage"
import { patientReviewInvoiceStorageKey } from "./PatientUploadInvoice"
import { useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/useToast"
import { useState, useEffect, useMemo } from "react"
import { Check, Trash2, Loader2 } from "lucide-react"
import Tag from "@/components/Tag"
import { trackEvent, EVENTS, safeAmount } from "@/analytics"
import { CashbackBanner } from "@/components/CashbackBanner"

// Track page view on mount
const useTrackSetBillAmountView = () => {
  useEffect(() => {
    try {
      trackEvent(EVENTS.PAYMENT.SET_BILL_AMOUNT_VIEW)
    } catch {
      // Silent fail
    }
  }, [])
}

type Inputs = {
  totalBillAmount: number
  careFundDiscountAmount: number
  discountCode?: string
}

type DiscountCodeResponse = {
  isValid: boolean
  discountAmount: string
  message?: string
}

export const patientSetBillAmountStorageKey = "patientSetBillAmount"

export default function PatientSetBillAmount() {
  useTrackSetBillAmountView()

  const { careFundAccount } =
    usePatientAuthStore((state: any) => state.user) || {}

  const state = useLocation().state
  const navigate = useNavigate()
  const { toast } = useToast()
  const savedData = useMemo(
    () => getFromLocalStorage(patientReviewInvoiceStorageKey) || {},
    []
  )
  const [discountCode, setDiscountCode] = useState(
    () => state?.discountCode ?? savedData.discountCode ?? ""
  )
  const [appliedDiscount, setAppliedDiscount] =
    useState<DiscountCodeResponse | null>(
      () => state?.appliedDiscount ?? savedData.appliedDiscount ?? null
    )

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = usePersistentForm<Inputs>(patientSetBillAmountStorageKey)

  const totalBillAmount = Number(watch("totalBillAmount") || 0)
  const careFundDiscountAmount = Number(watch("careFundDiscountAmount") || 0)

  // Validate discount code mutation
  const validateDiscountCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const userId = usePatientAuthStore.getState().user?.id
      if (!userId) {
        throw new Error("User ID not found")
      }

      // Get integer facility ID from the nested facility object
      const savedData =
        getFromLocalStorage(patientReviewInvoiceStorageKey) || {}
      const healthcareFacilityId =
        state?.kmpdcFacility?.facility?.id ??
        savedData?.kmpdcFacility?.facility?.id ??
        null

      const payload: Record<string, unknown> = {
        code: code.toUpperCase().trim(),
        orderAmount: totalBillAmount,
        userId: userId,
      }

      // Add facility ID if available (only required for facility-restricted codes)
      if (healthcareFacilityId != null) {
        payload.healthcareFacilityId = healthcareFacilityId
      }

      const { data: codeRow, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", payload.code as string)
        .maybeSingle()
      if (error) throw error
      if (!codeRow) {
        return { isValid: false, discountAmount: "0", message: "Invalid discount code" }
      }
      const discountAmt = Math.min(
        Number(codeRow.discount_amount || 0),
        Number(payload.orderAmount || 0)
      )
      return {
        isValid: true,
        discountAmount: String(discountAmt),
        message: codeRow.message || "Discount applied",
      }
    },
    onSuccess: (data: DiscountCodeResponse) => {
      if (data.isValid) {
        setAppliedDiscount(data)
        toast({
          title: "Discount Applied",
          description: data.message || "Discount code applied successfully",
        })
      } else {
        setAppliedDiscount(null)
        toast({
          title: "Invalid Code",
          description: data.message || "This discount code is not valid",
          variant: "destructive",
        })
      }
    },
    onError: (error: Error) => {
      setAppliedDiscount(null)
      toast({
        title: "Error",
        description: error.message || "Failed to validate discount code",
        variant: "destructive",
      })
    },
  })

  const { mutate: validateDiscountCode } = validateDiscountCodeMutation

  useEffect(() => {
    if (state?.totalBillAmount) {
      setValue("totalBillAmount", Math.round(Number(state.totalBillAmount)))
    }
    if (state?.discountCode) {
      setDiscountCode(state.discountCode)
      // Validate the discount code if provided in state
      if (state.totalBillAmount) {
        setTimeout(() => {
          validateDiscountCode(state.discountCode)
        }, 100)
      }
    }
  }, [
    state?.totalBillAmount,
    state?.discountCode,
    setValue,
    validateDiscountCode,
  ])

  // Re-validate discount code when bill amount changes (if code is already applied)
  useEffect(() => {
    if (discountCode && appliedDiscount?.isValid && totalBillAmount > 0) {
      // Debounce validation to avoid too many API calls
      const timeoutId = setTimeout(() => {
        validateDiscountCode(discountCode)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [
    totalBillAmount,
    discountCode,
    appliedDiscount?.isValid,
    validateDiscountCode,
  ])

  // Calculate discount amount
  const calculateDiscountAmount = (): number => {
    if (!appliedDiscount || !appliedDiscount.isValid || totalBillAmount === 0) {
      return 0
    }

    // The API returns the discountAmount directly
    const discount = parseFloat(appliedDiscount.discountAmount || "0")

    // Ensure discount doesn't exceed bill amount
    return Math.min(discount, totalBillAmount)
  }

  const discountAmount = calculateDiscountAmount()
  const newBillAmount =
    totalBillAmount - careFundDiscountAmount - discountAmount
  const cashbackAmount = formatMoney(newBillAmount * 0.05 || 0, "KES")
  const currency = careFundAccount?.currency?.code || "KES"

  const maxCareFundAmount = Math.min(
    careFundAccount?.careFundBalance || 0,
    totalBillAmount
  )

  const minTotalBillAmount = 150
  const isNetworkFacility =
    state?.kmpdcFacility?.facility?.facilityVerificationStatus === "APPROVED"

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="Bill amount"
      pageTitle="Set bill amount"
    >
      <form
        onSubmit={handleSubmit((data) => {
          const { totalBillAmount, careFundDiscountAmount } = data

          try {
            trackEvent(EVENTS.PAYMENT.SET_BILL_AMOUNT_SUBMIT, {
              totalBillAmount: safeAmount(totalBillAmount),
              careFundDiscountAmount: safeAmount(careFundDiscountAmount),
              hasDiscountCode: !!discountCode,
            })
          } catch {
            // Silent fail
          }

          // Update the stored invoice data (include only valid discount so invalid codes are cleared from storage)
          const storedInvoice =
            getFromLocalStorage(patientReviewInvoiceStorageKey) || {}
          setToLocalStorage(patientReviewInvoiceStorageKey, {
            ...storedInvoice,
            billAmount: totalBillAmount,
            discountCode:
              appliedDiscount?.isValid && discountCode?.trim()
                ? discountCode.trim()
                : undefined,
            appliedDiscount: appliedDiscount?.isValid
              ? appliedDiscount
              : undefined,
          })

          const navigationState = {
            ...state,
            totalBillAmount: totalBillAmount,
            careFundDiscountAmount,
            discountCode: discountCode || null,
            discountAmount: discountAmount,
            appliedDiscount: appliedDiscount,
          }

          if (state?.fromWalletSelection) {
            navigate("/patients/payment/request-payment/wallet-selection", {
              state: navigationState,
            })
          } else if (state?.fromReview) {
            navigate("/patients/payment/request-payment/review-invoice", {
              state: navigationState,
            })
          }
        })}
        className="flex flex-col gap-7"
      >
        <FormGroupInput
          id="totalBillAmount"
          label="Bill Amount"
          type="number"
          placeholder="Enter the total bill amount"
          register={register("totalBillAmount", {
            required: {
              value: true,
              message: "Please enter the total bill amount",
            },
            min: {
              value: minTotalBillAmount,
              message: `Total bill amount must be greater than ${formatMoney(minTotalBillAmount, "KES")}`,
            },
            validate: (value) => {
              const numValue = Number(value)
              if (isNaN(numValue)) {
                return "Please enter a valid number"
              }
              if (!Number.isInteger(numValue)) {
                return "Amount must be a whole number"
              }
              return true
            },
            setValueAs: (value) => {
              const numValue = Number(value)
              return isNaN(numValue) ? value : Math.round(numValue)
            },
          })}
          error={errors.totalBillAmount?.message}
          description={`Min: ${formatMoney(minTotalBillAmount, "KES")}`}
        />

        {/* Discount Code Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Discount Code (Optional)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={discountCode}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().trim()
                  setDiscountCode(value)
                  setAppliedDiscount(null)
                }}
                placeholder="Enter discount code"
                className="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {validateDiscountCodeMutation.isPending && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (discountCode.trim()) {
                  validateDiscountCodeMutation.mutate(discountCode)
                }
              }}
              disabled={
                !discountCode.trim() || validateDiscountCodeMutation.isPending
              }
            >
              Apply
            </Button>
            {appliedDiscount && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDiscountCode("")
                  setAppliedDiscount(null)
                }}
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </Button>
            )}
          </div>
          {appliedDiscount && appliedDiscount.isValid && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-200">
              <Check className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">
                  {appliedDiscount.message ||
                    "Discount code applied successfully"}
                </p>
                <p className="text-xs text-green-700">
                  Discount: {formatMoney(discountAmount, currency)}
                </p>
              </div>
              <Tag className="bg-green-600 text-white text-xs">
                {formatMoney(
                  parseFloat(appliedDiscount.discountAmount || "0"),
                  currency
                )}{" "}
                OFF
              </Tag>
            </div>
          )}
          {appliedDiscount && !appliedDiscount.isValid && (
            <p className="text-xs text-red-600">{appliedDiscount.message}</p>
          )}
        </div>

        {careFundAccount?.careFundBalance > 0 &&
          state?.kmpdcFacility?.facility?.facilityVerificationStatus ===
            "APPROVED" && (
            <FormGroupInput
              id="careFundDiscountAmount"
              label="Redeem from Care Fund"
              type="number"
              placeholder="Enter the Care Fund amount"
              register={register("careFundDiscountAmount", {
                min: {
                  value: 0,
                  message: `Care Fund discount amount must be greater than ${formatMoney(0, "KES")}`,
                },
                max: {
                  value: maxCareFundAmount,
                  message: `Care Fund amount cannot exceed ${formatMoney(
                    maxCareFundAmount,
                    "KES"
                  )}`,
                },
              })}
              error={errors.careFundDiscountAmount?.message}
              description={`Care Fund Balance (Max): ${formatMoney(
                maxCareFundAmount,
                currency
              )}`}
            />
          )}

        <div className="border-t mt-5 pt-2 space-y-2">
          {discountAmount > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">Discount</p>
              <p className="font-medium text-green-600">
                -{formatMoney(discountAmount, currency)}
              </p>
            </div>
          )}
          {careFundDiscountAmount > 0 && (
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">Care Fund</p>
              <p className="font-medium text-green-600">
                -{formatMoney(careFundDiscountAmount, currency)}
              </p>
            </div>
          )}
          <div className="flex justify-between items-center pt-2 ">
            <p className="text-muted-foreground font-medium">
              Total Bill Amount
            </p>
            <p className="font-medium flex gap-2">
              {formatMoney(newBillAmount, currency)}
              {(careFundDiscountAmount > 0 || discountAmount > 0) && (
                <span className="text-muted-foreground line-through">
                  {formatMoney(totalBillAmount, currency)}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Cashback Banner */}
        <CashbackBanner
          visible={isNetworkFacility}
          title="Pay the full bill via Jireh and earn!"
          description={`With a bill of ${formatMoney(newBillAmount, currency)}, you could earn up to ${cashbackAmount} cashback!`}
        />

        <Button>Save Changes</Button>
      </form>
    </PatientPageWrapper>
  )
}
