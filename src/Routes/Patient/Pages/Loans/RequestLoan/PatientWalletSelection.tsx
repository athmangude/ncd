import { useMemo, useState, useEffect, useRef } from "react"
import PatientPageWrapper from "../../PatientPageWrapper"
import { HEADER_ICON } from "@/Routes/shell/PageHeader"
import { useLocation, useNavigate } from "react-router-dom"
import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import { trackEvent, EVENTS, safeAmount } from "@/analytics"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import {
  getFromLocalStorage,
  setToLocalStorage,
} from "@/utilities/localStorage"
import { patientReviewInvoiceStorageKey } from "./PatientUploadInvoice"
import {
  ChevronRight,
  CreditCard,
  Minus,
  Pencil,
  Plus,
  Smartphone,
  Percent,
  Clock2,
  Check,
  Trash2,
  Loader2,
  Lock,
} from "lucide-react"
import useNextLoanApplicationStep from "@/Routes/Patient/hooks/useNextLoanApplicationStep"
import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"
import { useToast } from "@/hooks/useToast"
import landline from "@/assets/icons/landline.png"
import { useMutation } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import Tag from "@/components/Tag"
import {
  NotificationPermissionDrawer,
  useNotificationFlow,
} from "./NotificationPermissionDrawer"
import { WalletDrawer } from "./WalletDrawer"
import { CircleWaitingDrawer } from "./CircleWaitingDrawer"
import { Allocations, ExtendedUser, WalletItem, getWalletName } from "./types"

type DiscountCodeResponse = {
  isValid: boolean
  discountAmount: string
  message?: string
}

export default function PatientWalletSelection() {
  const location = useLocation()

  // Track page view on mount
  useEffect(() => {
    try {
      trackEvent(EVENTS.PAYMENT.WALLET_SELECTION_VIEW)
    } catch {
      // Silent fail
    }
  }, [])

  const isNetworkFacility =
    location.state?.kmpdcFacility?.facility?.facilityVerificationStatus ===
    "APPROVED"
  const navigate = useNavigate()
  const next = useNextLoanApplicationStep()
  const { user } = usePatientAuthStore() as { user: ExtendedUser }
  const { toast } = useToast()
  const { data: paymentHistory } = usePaymentHistory()
  const { careFundAccount } = paymentHistory || {}
  const { careFundBalance, currency } = careFundAccount || {}
  const careFundCurrency = currency?.code || "KES"
  // Compute raw balance (no rounding) matching CareFundCard source so display and validation are consistent
  const rawCareFundBalance =
    careFundBalance != null ? parseFloat(String(careFundBalance)) : undefined

  // Notification logic
  const {
    isOpen: isNotificationDrawerOpen,
    close: closeNotificationDrawer,
    isRequesting: isRequestingPermission,
    showHelp: showNotificationHelp,
    checkAndProceed,
    handleEnable: handleEnableNotifications,
    handleSkip: handleSkipNotifications,
  } = useNotificationFlow(user?.id)

  // Retrieve saved data
  const savedData = useMemo(
    () => getFromLocalStorage(patientReviewInvoiceStorageKey) || {},
    []
  )

  const originalBillAmount = Math.round(
    location.state?.totalBillAmount || savedData.billAmount || 0
  )

  // Discount code state (restore from location.state or persisted savedData when returning from payment confirmation)
  const [discountCode, setDiscountCode] = useState(
    () => location.state?.discountCode ?? savedData.discountCode ?? ""
  )
  const [appliedDiscount, setAppliedDiscount] =
    useState<DiscountCodeResponse | null>(
      () => location.state?.appliedDiscount ?? savedData.appliedDiscount ?? null
    )

  // Validate discount code mutation
  const validateDiscountCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const userId = usePatientAuthStore.getState().user?.id
      if (!userId) {
        throw new Error("User ID not found")
      }

      // Get integer facility ID from the nested facility object
      const healthcareFacilityId =
        location.state?.kmpdcFacility?.facility?.id ??
        savedData?.kmpdcFacility?.facility?.id ??
        null

      const payload: Record<string, unknown> = {
        code: code.toUpperCase().trim(),
        orderAmount: originalBillAmount,
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
      // Only update the appliedDiscount state - the useEffect will handle allocations
      setAppliedDiscount(data)
      if (data.isValid) {
        toast({
          title: "Discount Applied",
          description: data.message || "Discount code applied successfully",
        })
      } else {
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

  // State for allocations: map of walletId -> { amount, repaymentPeriodDays }
  const [allocations, setAllocations] = useState<Allocations>(
    savedData.allocations || {}
  )

  // Get wallets from user
  const wallets = useMemo(() => user?.wallets || [], [user])

  // Get discount wallet from user's wallets array (similar to other wallet types)
  // Note: The wallet type is "DISCOUNTS" (plural) in the API response
  const discountWallet = useMemo(() => {
    return wallets.find((w) => w.type === "DISCOUNT" || w.type === "DISCOUNTS")
  }, [wallets])

  // Get discount amount from allocations (if discount is applied)
  // Use the discount wallet's UUID (similar to other wallet types)
  const discountWalletId = discountWallet?.id || null
  const discountAllocation = discountWalletId
    ? allocations[discountWalletId]
    : null
  const discountAmount = discountAllocation?.amount || 0

  const careFundDiscountAmount = location.state?.careFundDiscountAmount || 0
  const totalBillAmount =
    originalBillAmount - careFundDiscountAmount - discountAmount

  // Re-validate discount code when returning to this page only if we restored the code but not the applied state (avoids showing loader when we already have applied state from storage)
  const hasRestoredDiscountFromStorage = useRef(false)
  useEffect(() => {
    if (!hasRestoredDiscountFromStorage.current) {
      hasRestoredDiscountFromStorage.current = true
      if (discountCode.trim() && !appliedDiscount) {
        validateDiscountCodeMutation.mutate(discountCode)
      } else if (discountCode.trim() && appliedDiscount?.isValid) {
        // We restored both code and applied state from storage – mark amount as already validated so the bill-amount effect doesn’t trigger another validation and loader
        lastValidatedAmountRef.current = originalBillAmount
      }
    }
    // Mount-only restoration gated by hasRestoredDiscountFromStorage ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-validate discount code when bill amount changes (if code is already applied)
  // Use a ref to track the last validated amount to prevent recursive calls
  const lastValidatedAmountRef = useRef<number>(0)
  useEffect(() => {
    if (
      discountCode &&
      appliedDiscount?.isValid &&
      originalBillAmount > 0 &&
      originalBillAmount !== lastValidatedAmountRef.current
    ) {
      lastValidatedAmountRef.current = originalBillAmount
      // Debounce validation to avoid too many API calls
      const timeoutId = setTimeout(() => {
        validateDiscountCodeMutation.mutate(discountCode)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
    // Deliberate single-trigger on bill-amount change; lastValidatedAmountRef prevents recursion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originalBillAmount])

  // Sync discount allocation with appliedDiscount state
  // Use a ref to track the last applied discount to prevent recursive updates
  const lastAppliedDiscountRef = useRef<string | null>(null)
  useEffect(() => {
    if (discountCode && appliedDiscount) {
      const discountKey = `${discountCode}-${appliedDiscount.isValid}-${appliedDiscount.discountAmount}`
      // Only update if the discount state actually changed
      if (lastAppliedDiscountRef.current === discountKey) {
        return
      }
      lastAppliedDiscountRef.current = discountKey

      if (appliedDiscount.isValid) {
        // Ensure discount wallet exists, if not, we can't create allocation
        if (!discountWallet?.id) {
          console.warn("Discount wallet not found in user wallets", {
            wallets: wallets.map((w) => ({ id: w.id, type: w.type })),
            discountWallet,
          })
          return
        }
        const discountWalletId = discountWallet.id
        // Round the discount amount to avoid floating point precision issues and ensure
        // whole number allocations, which matches KES formatting and original bill amount rounding
        const discountAmt = Math.round(
          parseFloat(appliedDiscount.discountAmount || "0")
        )
        if (discountAmt > 0) {
          setAllocations((prev) => {
            const existing = prev[discountWalletId]
            // Only update if amount changed or doesn't exist
            // Also ensure we're not doubling the amount - use the amount directly from API response
            if (!existing || existing.amount !== discountAmt) {
              return {
                ...prev,
                [discountWalletId]: {
                  amount: discountAmt, // Use the amount directly from API response, not doubled
                  type: "DISCOUNT" as const,
                  walletId: discountWalletId,
                  discountCode: discountCode.toUpperCase().trim(),
                },
              }
            }
            return prev
          })
        }
      } else if (!appliedDiscount.isValid && discountWallet?.id) {
        // Remove discount from allocations if invalid
        const discountWalletId = discountWallet.id
        setAllocations((prev) => {
          if (prev[discountWalletId]) {
            const newAllocations = { ...prev }
            delete newAllocations[discountWalletId]
            return newAllocations
          }
          return prev
        })
      }
    } else if ((!discountCode || !appliedDiscount) && discountWallet?.id) {
      // Remove discount allocation when discount code is cleared or appliedDiscount is null
      const discountWalletId = discountWallet.id
      setAllocations((prev) => {
        if (prev[discountWalletId]) {
          const newAllocations = { ...prev }
          delete newAllocations[discountWalletId]
          return newAllocations
        }
        return prev
      })
      // Reset ref when discount code is cleared
      if (!discountCode) {
        lastAppliedDiscountRef.current = null
      }
    }
    // Intentionally narrowed to the specific scalars/IDs that drive the sync;
    // including parent objects (appliedDiscount, discountWallet, wallets) would re-fire on unrelated reference churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    discountCode,
    appliedDiscount?.isValid,
    appliedDiscount?.discountAmount,
    discountWallet?.id,
  ])

  // Update local storage when allocations or discount state change (persist only valid discount so invalid codes are cleared from storage)
  useEffect(() => {
    const currentData =
      getFromLocalStorage(patientReviewInvoiceStorageKey) || {}
    setToLocalStorage(patientReviewInvoiceStorageKey, {
      ...currentData,
      allocations,
      discountCode:
        appliedDiscount?.isValid && discountCode?.trim()
          ? discountCode.trim()
          : undefined,
      appliedDiscount: appliedDiscount?.isValid ? appliedDiscount : undefined,
    })
  }, [allocations, discountCode, appliedDiscount])

  // Persist user.creditLimit so "available to borrow" and max loan amount are available in this flow (e.g. in WalletDrawer)
  useEffect(() => {
    if (user?.creditLimit) {
      const currentData =
        getFromLocalStorage(patientReviewInvoiceStorageKey) || {}
      setToLocalStorage(patientReviewInvoiceStorageKey, {
        ...currentData,
        creditLimit: user.creditLimit,
      })
    }
  }, [user?.creditLimit])

  // Drawer state
  const [activeWalletId, setActiveWalletId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCircleWaitingDrawerOpen, setIsCircleWaitingDrawerOpen] =
    useState(false)

  // Single source of truth: Jireh Medical Loan is disabled when user fails Plus or circle checks
  const isLoanOptionDisabled = useMemo(() => {
    const isPlusAccount = user?.type === "PLUS" || user?.hasActiveMembership
    if (!isPlusAccount) return true
    const patientCircle = user?.patientCircle
    const isCircleEligibleForLoan =
      patientCircle &&
      (patientCircle.filledAccountableSlots ?? 0) >= 2 &&
      patientCircle.status !== "INACTIVE" &&
      patientCircle.isFrozen !== true
    return !isCircleEligibleForLoan
  }, [user?.type, user?.hasActiveMembership, user?.patientCircle])

  // Auto-open loan drawer if returning from M-Pesa upload (only when LOAN option is enabled)
  useEffect(() => {
    if (
      location.state?.openLoanDrawer &&
      wallets.length > 0 &&
      !isLoanOptionDisabled
    ) {
      const loanWallet = wallets.find((w) => w.type === "LOAN")
      if (loanWallet && !isDrawerOpen) {
        setActiveWalletId(loanWallet.id)
        setIsDrawerOpen(true)
        navigate(location.pathname, {
          state: {
            ...location.state,
            openLoanDrawer: undefined,
          },
          replace: true,
        })
      }
    }
    // Trigger is the openLoanDrawer flag only; the spread of location.state is for forwarding,
    // not for tracking changes — broadening to the full state would re-fire on unrelated nav state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location.state?.openLoanDrawer,
    wallets,
    navigate,
    location.pathname,
    isDrawerOpen,
    isLoanOptionDisabled,
  ])

  const totalAllocated = useMemo(() => {
    // Use allocations as the single source of truth for all calculations
    // This includes discount allocations, wallet allocations, etc.
    return Object.values(allocations).reduce(
      (sum, curr) => sum + curr.amount,
      0
    )
  }, [allocations])

  // Calculate progress percentage
  const progressPercentage = Math.min(
    100,
    (totalAllocated / (totalBillAmount || 1)) * 100
  )

  const handleWalletClick = (walletId: string) => {
    // Prevent clicking on discount wallet
    if (walletId === discountWallet?.id) {
      return
    }
    // Prevent clicking on discount allocations
    const allocation = allocations[walletId]
    if (allocation?.type === "DISCOUNT") {
      return
    }
    // Prevent opening LOAN drawer when user does not pass Plus or circle checks
    const wallet = wallets.find((w) => w.id === walletId)
    if (wallet?.type === "LOAN" && isLoanOptionDisabled) {
      return
    }
    setActiveWalletId(walletId)
    setIsDrawerOpen(true)
  }

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  )

  const handleSaveAllocation = (
    amount: number,
    repaymentPeriodDays?: number,
    phoneNumber?: string
  ) => {
    if (!activeWalletId) return

    setAllocations((prev) => {
      const newAllocations = { ...prev }

      if (amount <= 0) {
        delete newAllocations[activeWalletId]
        return newAllocations
      }

      // Enforce exclusivity: MPESA vs CARD
      const activeType = activeWallet?.type
      if (activeType === "MPESA") {
        // Remove CARD if exists
        const cardWallet = wallets.find((w) => w.type === "CARD")
        if (cardWallet && newAllocations[cardWallet.id]) {
          delete newAllocations[cardWallet.id]
          toast({
            title: "Wallet Selection Updated",
            description: "Removed Card allocation as M-Pesa was selected.",
          })
        }
      } else if (activeType === "CARD") {
        // Remove MPESA if exists
        const mpesaWallet = wallets.find((w) => w.type === "MPESA")
        if (mpesaWallet && newAllocations[mpesaWallet.id]) {
          delete newAllocations[mpesaWallet.id]
          toast({
            title: "Wallet Selection Updated",
            description: "Removed M-Pesa allocation as Card was selected.",
          })
        }
      }

      newAllocations[activeWalletId] = {
        amount,
        repaymentPeriodDays,
        type: activeWallet?.type,
        // Use the passed phone number, or fallback to user phone if MPESA
        phoneNumber:
          activeWallet?.type === "MPESA"
            ? phoneNumber || user.phoneNumber
            : undefined,
        walletId: activeWalletId,
      }
      return newAllocations
    })
    setIsDrawerOpen(false)
  }

  const handleRemoveWallet = (e: React.MouseEvent, walletId: string) => {
    e.stopPropagation()
    setAllocations((prev) => {
      const newAllocations = { ...prev }
      delete newAllocations[walletId]
      return newAllocations
    })
  }

  const handleEdit = () => {
    navigate("/patients/payment/request-payment/set-bill-amount", {
      state: {
        ...location.state,
        totalBillAmount: originalBillAmount,
        discountCode: discountCode,
        fromWalletSelection: true,
      },
    })
  }
  const handleProceed = () => {
    // Validation: Compare totalAllocated (including discount) against originalBillAmount
    // This ensures we don't have excess when discount is included
    const roundedTotalAllocated = Math.round(totalAllocated)

    if (roundedTotalAllocated < originalBillAmount) {
      toast({
        title: "Insufficient Allocation",
        description: `Please allocate the remaining ${formatMoney(
          originalBillAmount - roundedTotalAllocated,
          "KES"
        )}`,
        variant: "destructive",
      })
      return
    }

    if (roundedTotalAllocated > originalBillAmount) {
      toast({
        title: "Over Allocation",
        description: `You have allocated ${formatMoney(
          roundedTotalAllocated - originalBillAmount,
          "KES"
        )} more than the bill amount.`,
        variant: "destructive",
      })
      return
    }

    checkAndProceed(executeProceed)
  }

  const executeProceed = () => {
    try {
      trackEvent(EVENTS.PAYMENT.WALLET_SELECTION_SUBMIT, {
        totalAllocated: safeAmount(totalAllocated),
        walletCount: Object.keys(allocations).length,
        hasDiscount: !!appliedDiscount?.isValid,
      })
    } catch {
      // Silent fail
    }

    // Construct walletAllocations for next step (discount is already in allocations)
    const walletAllocations = Object.entries(allocations).map(
      ([walletId, allocation]) => {
        // Check if it's a discount allocation
        if (allocation.type === "DISCOUNT") {
          return {
            walletId: allocation.walletId,
            amount: allocation.amount,
            enabled: true,
            type: "DISCOUNT" as const,
            discountCode: allocation.discountCode,
          }
        }
        // Regular wallet allocation
        const wallet = wallets.find((w) => w.id === walletId)
        return {
          walletId,
          amount: allocation.amount,
          enabled: true,
          type: wallet?.type,
          phoneNumber: allocation.phoneNumber,
        }
      }
    )

    // Ensure discount is included in walletAllocations if validated
    // Check if discount allocation exists in walletAllocations, if not, add it
    const hasDiscountInAllocations = walletAllocations.some(
      (alloc) => alloc.type === "DISCOUNT"
    )

    // If discount is validated, ensure it's included in walletAllocations
    if (
      appliedDiscount?.isValid &&
      appliedDiscount.discountAmount &&
      discountCode
    ) {
      const discountAmt = parseFloat(appliedDiscount.discountAmount || "0")

      // Only add if amount is valid and not already in allocations
      if (discountAmt > 0 && !hasDiscountInAllocations) {
        // Try to get discount wallet ID from existing allocation first, then from discountWallet
        // Check discountAllocation first (if allocation was created), then discountWalletId, then discountWallet
        const finalDiscountWalletId =
          discountAllocation?.walletId || discountWalletId || discountWallet?.id

        if (finalDiscountWalletId) {
          walletAllocations.push({
            walletId: finalDiscountWalletId,
            amount: discountAmt,
            enabled: true,
            type: "DISCOUNT" as const,
            discountCode: discountCode.toUpperCase().trim(),
          })
        } else {
          console.error(
            "Discount validated but discount wallet ID not found. Cannot include discount in payment splits.",
            {
              appliedDiscount,
              discountWallet,
              discountWalletId,
              discountAllocation,
              allocationsKeys: Object.keys(allocations),
            }
          )
        }
      }
    }

    // Extract loan repayment period if available
    const loanAllocation = Object.values(allocations).find(
      (a) => a.type !== "DISCOUNT" && a.repaymentPeriodDays
    )
    const repaymentPeriodDays = loanAllocation?.repaymentPeriodDays

    navigate(next, {
      state: {
        ...location.state,
        allocations,
        walletAllocations,
        wallets: wallets.filter((w) => allocations[w.id]),
        totalAllocated,
        repaymentPeriodDays,
        totalBillAmount,
        originalBillAmount,
        discountCode: discountCode || null,
        discountAmount: discountAmount,
        discountWalletId: discountWalletId,
        appliedDiscount: appliedDiscount,
        careFundDiscountAmount: careFundDiscountAmount,
        careProvider: location.state?.careProvider,
        patient: location.state?.patient,
        fileId: location.state?.fileId,
        paymentInfo: location.state?.paymentInfo,
      },
    })
  }

  const getWalletSubtitle = (wallet: WalletItem) => {
    if (wallet.type === "CASHBACK") {
      return `Cashback earned or received . `
    }
    if (wallet.type === "LOAN") {
      return `Borrow and repay at 0% interest rate .`
    }
    if (wallet.type === "MPESA") {
      // Check if an allocation exists for this wallet to show the specific phone number being used
      const alloc = allocations[wallet.id]
      if (alloc && alloc.phoneNumber) {
        return `Using ${alloc.phoneNumber}`
      }
      return "Your Safaricom MPESA"
    }
    if (wallet.type === "CARD") {
      return "Visa, Mastercard etc."
    }
    return ""
  }

  const allocatedWallets = wallets.filter((w) => {
    const alloc = allocations[w.id]
    // Only show wallets with allocations, excluding discount allocations
    return alloc && alloc.amount > 0 && alloc.type !== "DISCOUNT"
  })
  const unallocatedWallets = wallets.filter((w) => {
    // Explicitly exclude any wallet with type "DISCOUNT" or "DISCOUNTS" - discounts should never appear in "Add source of funds"
    const walletType = (w as any).type
    if (walletType === "DISCOUNT" || walletType === "DISCOUNTS") {
      return false
    }
    // Explicitly exclude the discount wallet by ID
    if (discountWallet && w.id === discountWallet.id) {
      return false
    }
    const alloc = allocations[w.id]
    // Exclude wallets that have allocations (unless amount is 0 or negative)
    // Also explicitly exclude any discount-related allocations
    if (alloc) {
      // If allocation exists, only show if amount is 0 or negative, and it's not a discount
      return alloc.amount <= 0 && alloc.type !== "DISCOUNT"
    }
    // If no allocation, show the wallet
    return true
  })

  return (
    <PatientPageWrapper
      variant="content"
      barTitle="Select wallet"
      showHelp
      headerIcon={<img src={landline} alt="" className={HEADER_ICON} />}
      pageTitle="Select how you want to pay"
      description="Add as many sources of funds as you want."
      primaryCta={{
        label: (
          <>
            Proceed to pay
            <ChevronRight className="w-5 h-5" />
          </>
        ),
        onClick: () => handleProceed(),
        disabled: Math.round(totalAllocated) !== originalBillAmount,
      }}
    >
      <div className="flex flex-col gap-6">
        {/* Discount Code Input */}
        <div className="bg-card border border-border rounded-xl p-4 mx-1 space-y-3">
          <label className="text-sm font-medium text-foreground">
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
                  {appliedDiscount.message || "Discount code applied"}
                </p>
                <p className="text-xs text-green-700">
                  Discount: {formatMoney(discountAmount, "KES")}
                </p>
              </div>
              <Tag className="bg-green-600 text-white text-xs">
                {formatMoney(discountAmount, "KES")} OFF
              </Tag>
            </div>
          )}
          {appliedDiscount && !appliedDiscount.isValid && (
            <p className="text-xs text-red-600">{appliedDiscount.message}</p>
          )}
        </div>

        {/* Progress/Summary Bar */}
        <div className="bg-muted rounded-xl p-5 flex flex-col gap-3 mx-1">
          <div className="w-full bg-border rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-bold text-foreground">
                {formatMoney(totalAllocated, "KES")}
              </p>
              <p className="text-sm text-muted-foreground">Allocated</p>
            </div>
            <div className="text-right">
              <p
                className="text-lg font-bold text-foreground flex items-center justify-end gap-2 cursor-pointer"
                onClick={() => handleEdit()}
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
                {formatMoney(totalBillAmount, "KES")}
                {(discountAmount > 0 || careFundDiscountAmount > 0) && (
                  <span className="text-muted-foreground line-through text-base">
                    {formatMoney(originalBillAmount, "KES")}
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">Total bill</p>
            </div>
          </div>
          {(discountAmount > 0 || careFundDiscountAmount > 0) && (
            <div className="border-t pt-3 space-y-1">
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <p className="text-muted-foreground">Discount</p>
                  <p className="font-medium text-green-600">
                    -{formatMoney(discountAmount, "KES")}
                  </p>
                </div>
              )}
              {careFundDiscountAmount > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <p className="text-muted-foreground">Care Fund</p>
                  <p className="font-medium text-green-600">
                    -{formatMoney(careFundDiscountAmount, "KES")}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Allocated Wallets */}
        {allocatedWallets.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground font-medium px-1">
              Source of funds
            </p>
            <div className="flex flex-col gap-3">
              {allocatedWallets.map((wallet) => {
                const allocation = allocations[wallet.id]
                if (!allocation || allocation.type === "DISCOUNT") return null
                const isAllocatedLoanDisabled =
                  wallet.type === "LOAN" && isLoanOptionDisabled
                return (
                  <div
                    key={wallet.id}
                    className={`border border-border rounded-xl p-4 flex items-center justify-between transition-colors ${
                      isAllocatedLoanDisabled
                        ? "bg-muted cursor-not-allowed opacity-75"
                        : "bg-card cursor-pointer hover:border-primary"
                    }`}
                    onClick={() =>
                      !isAllocatedLoanDisabled && handleWalletClick(wallet.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg bg-red-500 hover:opacity-80 transition-opacity`}
                        onClick={(e) => handleRemoveWallet(e, wallet.id)}
                      >
                        <Minus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {getWalletName(wallet.type)}
                        </p>
                        <div className="flex flex-col">
                          <p className="text-sm text-muted-foreground">
                            {formatMoney(allocation.amount, "KES")}
                          </p>
                          {/* Show phone number in list if MPESA */}
                          {wallet.type === "MPESA" &&
                            allocation.phoneNumber && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {allocation.phoneNumber}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                    <Pencil className="w-5 h-5 text-muted-foreground" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Unallocated Wallets */}
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground font-medium px-1">
            Add source of funds
          </p>
          <div className="flex flex-col gap-3">
            {unallocatedWallets
              .filter((wallet) => {
                // Explicitly exclude any discount allocations - discounts should not appear in "Add source of funds"
                const alloc = allocations[wallet.id]
                if (alloc && alloc.type === "DISCOUNT") {
                  return false
                }
                // Also check wallet type to ensure no discount-related wallets appear
                const walletType = (wallet as any).type
                if (walletType === "DISCOUNT") {
                  return false
                }
                // Check wallet name to ensure no discount-related wallets appear
                const walletName = getWalletName(wallet.type)
                if (walletName.toUpperCase().includes("DISCOUNT")) {
                  return false
                }
                return true
              })
              .map((wallet) => {
                // Use shared loan-disabled state (Plus check first, then circle eligibility)
                const isLoanWallet = wallet.type === "LOAN"
                const isPlusAccount =
                  user?.type === "PLUS" || user?.hasActiveMembership
                const isLoanDisabledByPlus = isLoanWallet && !isPlusAccount
                const isLoanDisabled = isLoanWallet && isLoanOptionDisabled
                const isLoanDisabledByCircle =
                  isLoanWallet && isPlusAccount && isLoanOptionDisabled

                return (
                  <div
                    key={wallet.id}
                    className={`border rounded-xl p-4 flex items-center justify-between gap-4 transition-colors ${
                      isLoanDisabled
                        ? "border-border bg-muted cursor-not-allowed"
                        : "border-border bg-card cursor-pointer hover:border-primary"
                    }`}
                    onClick={() => {
                      if (!isLoanDisabled) {
                        handleWalletClick(wallet.id)
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-lg bg-transparent shrink-0 ${isLoanDisabled ? "opacity-50" : ""}`}
                      >
                        {wallet.type === "MPESA" && (
                          <Smartphone className="w-6 h-6 text-muted-foreground" />
                        )}
                        {wallet.type === "CARD" && (
                          <CreditCard className="w-6 h-6 text-muted-foreground" />
                        )}
                        {wallet.type === "CASHBACK" && (
                          <Percent className="w-6 h-6 text-muted-foreground" />
                        )}
                        {wallet.type === "LOAN" && (
                          <Clock2
                            className={`w-6 h-6 ${isLoanDisabled ? "text-muted-foreground" : "text-muted-foreground"}`}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={isLoanDisabled ? "opacity-50" : ""}>
                          <p
                            className={`font-medium ${isLoanDisabled ? "text-muted-foreground" : "text-foreground"}`}
                          >
                            {getWalletName(wallet.type)}
                          </p>
                          <p
                            className={`text-sm mt-0.5 ${isLoanDisabled ? "text-muted-foreground" : "text-muted-foreground"}`}
                          >
                            {getWalletSubtitle(wallet)}
                          </p>
                        </div>
                        {isLoanDisabled && (
                          <div className="mt-2 flex items-center gap-2 flex-wrap">
                            {isLoanDisabledByPlus ? (
                              <>
                                <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                                <p className="text-xs text-muted-foreground">
                                  Upgrade to Jireh Plus to unlock
                                </p>
                                <Chip
                                  variant="default"
                                  className="shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    navigate("/patients/kyc-setup-intro", {
                                      state: {
                                        returnTo: location.pathname,
                                        returnState: location.state,
                                      },
                                    })
                                  }}
                                >
                                  Upgrade
                                  <ChevronRight className="w-3 h-3" />
                                </Chip>
                              </>
                            ) : (
                              <Chip
                                variant="warning"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setIsCircleWaitingDrawerOpen(true)
                                }}
                              >
                                Waiting on 2 Circle members
                                <ChevronRight className="w-3 h-3" />
                              </Chip>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {!isLoanDisabled ? (
                      <div className="bg-purple-100 p-1 rounded-md shrink-0">
                        <Plus className="w-5 h-5 text-primary" />
                      </div>
                    ) : isLoanDisabledByCircle ? (
                      <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : null}
                  </div>
                )
              })}
          </div>
        </div>

        <WalletDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          wallet={activeWallet}
          onSave={handleSaveAllocation}
          totalBillAmount={totalBillAmount}
          allocations={allocations}
          totalAllocated={totalAllocated}
          user={user}
          isNetworkFacility={isNetworkFacility}
          careFundBalance={rawCareFundBalance}
          careFundCurrency={careFundCurrency}
        />

        <NotificationPermissionDrawer
          isOpen={isNotificationDrawerOpen}
          onClose={closeNotificationDrawer}
          onEnable={handleEnableNotifications}
          onSkip={handleSkipNotifications}
          isRequesting={isRequestingPermission}
          showHelp={showNotificationHelp}
        />

        <CircleWaitingDrawer
          isOpen={isCircleWaitingDrawerOpen}
          onClose={() => setIsCircleWaitingDrawerOpen(false)}
          user={user}
        />
      </div>
    </PatientPageWrapper>
  )
}
