import { useEffect, useMemo, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import axios from "axios"
import { useLocation, useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { HEADER_ICON } from "@/Routes/shell/PageHeader"
import { Button } from "@/components/Button"
import Tag from "@/components/Tag"
import { useToast } from "@/hooks/useToast"
import { trackEvent, EVENTS, safeAmount } from "@/analytics"
import { usePatientAuthStore } from "../../stores/patientAuthStore"
import { formatMoney } from "@/utilities/currencyUtilities"
import { WalletDrawer } from "../Loans/RequestLoan/WalletDrawer"
import { CircleWaitingDrawer } from "../Loans/RequestLoan/CircleWaitingDrawer"
import type {
  ExtendedUser,
  WalletItem,
  WalletType,
} from "../Loans/RequestLoan/types"
import { getWalletName } from "../Loans/RequestLoan/types"
import type { PaymentSplit, SplitMode } from "./types"
import { useFastTrackStore } from "./useFastTrackStore"
import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"
import {
  ChevronRight,
  Minus,
  Pencil,
  Plus,
  Smartphone,
  Percent,
  Clock2,
  Lock,
  Loader2,
  Check,
  Trash2,
} from "lucide-react"
import landline from "@/assets/icons/landline.png"

const WALLET_TYPE_TO_SPLIT_MODE: Partial<Record<WalletType, SplitMode>> = {
  MPESA: "MPESA",
  LOAN: "LOAN",
  CASHBACK: "CAREFUND",
}

type DiscountCodeResponse = {
  isValid: boolean
  discountAmount: string
  message?: string
}

export default function FastTrackWalletSelection() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = usePatientAuthStore() as { user: ExtendedUser }

  useEffect(() => {
    trackEvent(EVENTS.FAST_TRACK_PAYMENT.WALLET_SELECTION_VIEW)
  }, [])

  const provider = useFastTrackStore((s) => s.provider)
  const invoiceAmountStr = useFastTrackStore((s) => s.invoiceAmount)
  const discountAmountStr = useFastTrackStore((s) => s.discountAmount)
  const setDiscountAmount = useFastTrackStore((s) => s.setDiscountAmount)
  const discountCode = useFastTrackStore((s) => s.discountCode)
  const setDiscountCode = useFastTrackStore((s) => s.setDiscountCode)
  const allocations = useFastTrackStore((s) => s.allocations)
  const setAllocations = useFastTrackStore((s) => s.setAllocations)
  const setSplits = useFastTrackStore((s) => s.setSplits)

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

  const { data: paymentHistory } = usePaymentHistory()
  const { careFundAccount } = paymentHistory || {}
  const { careFundBalance, currency } = careFundAccount || {}
  const careFundCurrency = currency?.code || "KES"
  // Compute raw balance (no rounding) matching CareFundCard source so display and validation are consistent
  const rawCareFundBalance =
    careFundBalance != null ? parseFloat(String(careFundBalance)) : undefined

  const totalBillAmount = parseFloat(invoiceAmountStr) || 0
  const discountAmount = parseFloat(discountAmountStr) || 0
  const netAmount = totalBillAmount - discountAmount

  const validateDiscountCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      const facilityId = provider?.facility?.id
      const payload: Record<string, unknown> = {
        code: code.toUpperCase().trim(),
        orderAmount: totalBillAmount,
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
      return response.data.data || response.data
    },
    onSuccess: (data: DiscountCodeResponse) => {
      setAppliedDiscount(data)
      if (data.isValid) {
        setDiscountAmount(data.discountAmount)
        toast({
          title: "Discount Applied",
          description: data.message || "Discount code applied successfully",
        })
      } else {
        setDiscountAmount("0")
        toast({
          title: "Invalid Code",
          description: data.message || "This discount code is not valid",
          variant: "destructive",
        })
      }
    },
    onError: (error: any) => {
      setAppliedDiscount(null)
      setDiscountAmount("0")
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to validate discount code",
        variant: "destructive",
      })
    },
  })

  const [activeWalletId, setActiveWalletId] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCircleWaitingDrawerOpen, setIsCircleWaitingDrawerOpen] =
    useState(false)

  const handleEditAmount = () => {
    navigate("/patients/fast-track/payment-details")
  }

  // Fast track only supports MPESA, LOAN, CASHBACK — filter out CARD and DISCOUNT wallets
  const wallets = useMemo(() => {
    return (user?.wallets || []).filter(
      (w) =>
        w.type !== "CARD" && w.type !== "DISCOUNT" && w.type !== "DISCOUNTS"
    )
  }, [user])

  const isLoanOptionDisabled = useMemo(() => {
    const isPlusAccount = user?.type === "PLUS" || user?.hasActiveMembership
    if (!isPlusAccount) return true
    const patientCircle = user?.patientCircle
    return !(
      patientCircle &&
      (patientCircle.filledAccountableSlots ?? 0) >= 2 &&
      patientCircle.status !== "INACTIVE" &&
      patientCircle.isFrozen !== true
    )
  }, [user?.type, user?.hasActiveMembership, user?.patientCircle])

  const totalAllocated = useMemo(() => {
    return Object.values(allocations).reduce(
      (sum, curr) => sum + curr.amount,
      0
    )
  }, [allocations])

  const progressPercentage = Math.min(
    100,
    (totalAllocated / (netAmount || 1)) * 100
  )

  const activeWallet = useMemo(
    () => wallets.find((w) => w.id === activeWalletId),
    [wallets, activeWalletId]
  )

  const handleWalletClick = (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    if (wallet?.type === "LOAN" && isLoanOptionDisabled) return
    setActiveWalletId(walletId)
    setIsDrawerOpen(true)
  }

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

      const activeType = activeWallet?.type
      if (activeType === "MPESA") {
        const cardWallet = wallets.find((w) => w.type === "CARD")
        if (cardWallet && newAllocations[cardWallet.id]) {
          delete newAllocations[cardWallet.id]
        }
      }

      newAllocations[activeWalletId] = {
        amount,
        repaymentPeriodDays,
        type: activeWallet?.type,
        phoneNumber:
          activeWallet?.type === "MPESA"
            ? phoneNumber || user.phoneNumber
            : undefined,
        walletId: activeWalletId,
      }
      return newAllocations
    })
    trackEvent(EVENTS.FAST_TRACK_PAYMENT.WALLET_ALLOCATE, {
      wallet_type: activeWallet?.type,
      amount: safeAmount(amount),
      payment_point_id: provider?.id,
      facility_id: provider?.facility?.id,
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

  const handleProceed = () => {
    if (!provider) return

    if (netAmount < 0) {
      toast({
        title: "Invalid discount",
        description: "Discount cannot exceed the invoice amount",
        variant: "destructive",
      })
      return
    }

    if (totalAllocated < netAmount) {
      toast({
        title: "Insufficient Allocation",
        description: `Please allocate the remaining ${formatMoney(netAmount - totalAllocated, "KES")}`,
        variant: "destructive",
      })
      return
    }

    if (totalAllocated > netAmount) {
      toast({
        title: "Over Allocation",
        description: `You have allocated ${formatMoney(totalAllocated - netAmount, "KES")} more than the amount to pay.`,
        variant: "destructive",
      })
      return
    }

    const DEFAULT_LOAN_REPAYMENT_DAYS = 31
    const computedSplits: PaymentSplit[] = Object.entries(allocations)
      .map(([walletId, allocation]) => {
        const wallet = wallets.find((w) => w.id === walletId)
        if (!wallet) return null
        const mode = WALLET_TYPE_TO_SPLIT_MODE[wallet.type]
        if (!mode) return null
        const split: PaymentSplit = { mode, amount: allocation.amount }
        if (mode === "LOAN") {
          const days =
            allocation.repaymentPeriodDays != null
              ? Number(allocation.repaymentPeriodDays)
              : DEFAULT_LOAN_REPAYMENT_DAYS
          split.repaymentPeriodDays = days
        }
        return split
      })
      .filter(Boolean) as PaymentSplit[]

    if (discountAmount > 0) {
      computedSplits.push({ mode: "DISCOUNT", amount: discountAmount })
    }

    setSplits(computedSplits)
    navigate("/patients/fast-track/confirm")
  }

  const getWalletSubtitle = (wallet: WalletItem) => {
    if (wallet.type === "CASHBACK") return "Cashback earned or received."
    if (wallet.type === "LOAN") return "Borrow and repay at 0% interest rate."
    if (wallet.type === "MPESA") {
      const alloc = allocations[wallet.id]
      if (alloc?.phoneNumber) return `Using ${alloc.phoneNumber}`
      return "Your Safaricom MPESA"
    }
    return ""
  }

  const allocatedWallets = wallets.filter((w) => {
    const alloc = allocations[w.id]
    return alloc && alloc.amount > 0
  })

  const unallocatedWallets = wallets.filter((w) => {
    const alloc = allocations[w.id]
    return !alloc || alloc.amount <= 0
  })

  return (
    <PatientPageWrapper
      variant="content"
      headerIcon={<img src={landline} alt="" className={HEADER_ICON} />}
      pageTitle="Select how you want to pay"
      description="Add as many sources of funds as you want."
    >
      <div className="flex flex-col gap-6 pb-32">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 mx-1 space-y-3">
          <label className="text-sm font-medium text-neutral-900">
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
                  setDiscountAmount("0")
                }}
                placeholder="Enter discount code"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-[#A826FF] focus:outline-none focus:ring-1 focus:ring-[#A826FF]"
              />
              {validateDiscountCodeMutation.isPending && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-neutral-400" />
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
                  setDiscountAmount("0")
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

        <div className="bg-neutral-50 rounded-xl p-5 flex flex-col gap-3 mx-1">
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-[#A826FF] h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-bold text-neutral-900">
                {formatMoney(totalAllocated, "KES")}
              </p>
              <p className="text-sm text-neutral-500">Allocated</p>
            </div>
            <div className="text-right">
              <p
                className="text-lg font-bold text-neutral-900 flex items-center justify-end gap-2 cursor-pointer"
                onClick={handleEditAmount}
              >
                <Pencil className="w-4 h-4 text-neutral-400" />
                {formatMoney(netAmount, "KES")}
                {discountAmount > 0 && (
                  <span className="text-neutral-400 line-through text-base">
                    {formatMoney(totalBillAmount, "KES")}
                  </span>
                )}
              </p>
              <p className="text-sm text-neutral-500">Amount to pay</p>
            </div>
          </div>
          {discountAmount > 0 && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center text-sm">
                <p className="text-neutral-600">Discount</p>
                <p className="font-medium text-green-600">
                  -{formatMoney(discountAmount, "KES")}
                </p>
              </div>
            </div>
          )}
        </div>

        {allocatedWallets.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-neutral-500 font-medium px-1">Source of funds</p>
            <div className="flex flex-col gap-3">
              {allocatedWallets.map((wallet) => {
                const allocation = allocations[wallet.id]
                if (!allocation) return null
                const isAllocatedLoanDisabled =
                  wallet.type === "LOAN" && isLoanOptionDisabled
                return (
                  <div
                    key={wallet.id}
                    className={`border border-neutral-200 rounded-xl p-4 flex items-center justify-between transition-colors ${
                      isAllocatedLoanDisabled
                        ? "bg-neutral-50 cursor-not-allowed opacity-75"
                        : "bg-white cursor-pointer hover:border-[#A826FF]"
                    }`}
                    onClick={() =>
                      !isAllocatedLoanDisabled && handleWalletClick(wallet.id)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg bg-red-500 hover:opacity-80 transition-opacity"
                        onClick={(e) => handleRemoveWallet(e, wallet.id)}
                      >
                        <Minus className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">
                          {getWalletName(wallet.type)}
                        </p>
                        <div className="flex flex-col">
                          <p className="text-sm text-neutral-500">
                            {formatMoney(allocation.amount, "KES")}
                          </p>
                          {wallet.type === "MPESA" &&
                            allocation.phoneNumber && (
                              <p className="text-xs text-neutral-400 mt-0.5">
                                {allocation.phoneNumber}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>
                    <Pencil className="w-5 h-5 text-neutral-400" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <p className="text-neutral-500 font-medium px-1">
            Add source of funds
          </p>
          <div className="flex flex-col gap-3">
            {unallocatedWallets.map((wallet) => {
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
                      ? "border-neutral-200 bg-neutral-50 cursor-not-allowed"
                      : "border-neutral-200 bg-white cursor-pointer hover:border-[#A826FF]"
                  }`}
                  onClick={() => {
                    if (!isLoanDisabled) handleWalletClick(wallet.id)
                  }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-lg bg-transparent shrink-0 ${isLoanDisabled ? "opacity-50" : ""}`}
                    >
                      {wallet.type === "MPESA" && (
                        <Smartphone className="w-6 h-6 text-neutral-500" />
                      )}
                      {wallet.type === "CASHBACK" && (
                        <Percent className="w-6 h-6 text-neutral-500" />
                      )}
                      {wallet.type === "LOAN" && (
                        <Clock2
                          className={`w-6 h-6 ${isLoanDisabled ? "text-neutral-400" : "text-neutral-500"}`}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={isLoanDisabled ? "opacity-50" : ""}>
                        <p
                          className={`font-medium ${isLoanDisabled ? "text-neutral-500" : "text-neutral-900"}`}
                        >
                          {getWalletName(wallet.type)}
                        </p>
                        <p
                          className={`text-sm mt-0.5 ${isLoanDisabled ? "text-neutral-400" : "text-neutral-500"}`}
                        >
                          {getWalletSubtitle(wallet)}
                        </p>
                      </div>
                      {isLoanDisabled && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {isLoanDisabledByPlus ? (
                            <>
                              <Lock className="w-3 h-3 text-neutral-400 shrink-0" />
                              <p className="text-xs text-neutral-500">
                                Upgrade to Jireh Plus to unlock
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  navigate("/patients/kyc-setup-intro", {
                                    state: {
                                      returnTo: location.pathname,
                                      returnState: location.state,
                                    },
                                  })
                                }}
                                className="bg-[#9333EA] hover:bg-[#7E22CE] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shrink-0"
                              >
                                Upgrade
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-[3px] rounded-md"
                              onClick={(e) => {
                                e.stopPropagation()
                                setIsCircleWaitingDrawerOpen(true)
                              }}
                            >
                              Waiting on 2 Circle members
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {!isLoanDisabled ? (
                    <div className="bg-purple-100 p-1 rounded-md shrink-0">
                      <Plus className="w-5 h-5 text-[#A826FF]" />
                    </div>
                  ) : isLoanDisabledByCircle ? (
                    <Lock className="w-4 h-4 text-neutral-400 shrink-0" />
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-neutral-200 md:static md:border-0 md:p-0 md:bg-transparent z-10">
          <Button
            className="w-full bg-[#A826FF] hover:bg-[#9220DE] text-white font-semibold py-6 rounded-xl flex items-center justify-center gap-2 text-lg shadow-lg shadow-purple-200"
            onClick={handleProceed}
            disabled={totalAllocated !== netAmount}
          >
            Review Payment
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <WalletDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          wallet={activeWallet}
          onSave={handleSaveAllocation}
          totalBillAmount={netAmount}
          allocations={allocations}
          totalAllocated={totalAllocated}
          user={user}
          isNetworkFacility={true}
          careFundBalance={rawCareFundBalance}
          careFundCurrency={careFundCurrency}
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
