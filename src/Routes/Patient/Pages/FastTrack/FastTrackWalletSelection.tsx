import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import PatientPageWrapper from "../PatientPageWrapper"
import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import { Progress } from "@/components/Progress"
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
} from "@/components/Item"
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
} from "lucide-react"

const WALLET_TYPE_TO_SPLIT_MODE: Partial<Record<WalletType, SplitMode>> = {
  MPESA: "MPESA",
  LOAN: "LOAN",
  CASHBACK: "CAREFUND",
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
  const allocations = useFastTrackStore((s) => s.allocations)
  const setAllocations = useFastTrackStore((s) => s.setAllocations)
  const setSplits = useFastTrackStore((s) => s.setSplits)

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

  const getWalletTitle = (wallet: WalletItem) => {
    const name = getWalletName(wallet.type)
    if (wallet.type === "MPESA") {
      const phoneNumber =
        allocations[wallet.id]?.phoneNumber || user?.phoneNumber
      return phoneNumber ? `${name} (${phoneNumber})` : name
    }
    return name
  }

  const getWalletBalanceDescription = (wallet: WalletItem) => {
    if (wallet.type === "CASHBACK") {
      const balance = rawCareFundBalance ?? parseFloat(wallet.remainingBalance)
      if (balance == null || Number.isNaN(balance)) return null
      return `Balance: ${formatMoney(balance, careFundCurrency)}`
    }
    if (wallet.type === "LOAN") {
      const available = Number(user?.creditLimit?.remainingAmount)
      if (Number.isNaN(available)) return null
      return `Available to borrow: ${formatMoney(available, "KES")}`
    }
    return null
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
      barTitle="Select wallet"
      pageTitle="Select how you want to pay"
      description="Add as many sources of funds as you want."
      primaryCta={{
        label: (
          <>
            Review Payment
            <ChevronRight className="w-5 h-5" />
          </>
        ),
        onClick: handleProceed,
        disabled: totalAllocated !== netAmount,
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="bg-muted rounded-xl p-3 flex flex-col gap-3">
          <Progress value={progressPercentage} className="h-2" />
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
                onClick={handleEditAmount}
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
                {formatMoney(netAmount, "KES")}
                {discountAmount > 0 && (
                  <span className="text-muted-foreground line-through text-base">
                    {formatMoney(totalBillAmount, "KES")}
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">Amount to pay</p>
            </div>
          </div>
          {discountAmount > 0 && (
            <div className="border-t pt-3">
              <div className="flex justify-between items-center text-sm">
                <p className="text-muted-foreground">Discount</p>
                <p className="font-medium text-green-600">
                  -{formatMoney(discountAmount, "KES")}
                </p>
              </div>
            </div>
          )}
        </div>

        {allocatedWallets.length > 0 && (
          <div className="flex flex-col gap-2">
            <h2>Source of funds</h2>
            <div className="flex flex-col gap-2">
              {allocatedWallets.map((wallet) => {
                const allocation = allocations[wallet.id]
                if (!allocation) return null
                const isAllocatedLoanDisabled =
                  wallet.type === "LOAN" && isLoanOptionDisabled
                return (
                  <Item
                    key={wallet.id}
                    asChild
                    variant="outline"
                    className={
                      isAllocatedLoanDisabled
                        ? "bg-muted cursor-not-allowed opacity-75"
                        : "bg-card cursor-pointer hover:border-primary"
                    }
                  >
                    <div
                      onClick={() =>
                        !isAllocatedLoanDisabled && handleWalletClick(wallet.id)
                      }
                    >
                      <ItemMedia
                        className="rounded-lg bg-red-500 hover:opacity-80 transition-opacity"
                        onClick={(e) => handleRemoveWallet(e, wallet.id)}
                      >
                        <Minus className="w-5 h-5 text-white" />
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="font-semibold text-foreground">
                          {getWalletName(wallet.type)}
                        </ItemTitle>
                        <ItemDescription className="text-muted-foreground">
                          {formatMoney(allocation.amount, "KES")}
                        </ItemDescription>
                        {wallet.type === "MPESA" && allocation.phoneNumber && (
                          <ItemDescription className="text-xs text-muted-foreground">
                            {allocation.phoneNumber}
                          </ItemDescription>
                        )}
                      </ItemContent>
                      <ItemActions>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${getWalletName(wallet.type)} amount`}
                          disabled={isAllocatedLoanDisabled}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isAllocatedLoanDisabled)
                              handleWalletClick(wallet.id)
                          }}
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </ItemActions>
                    </div>
                  </Item>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h2>Add source of funds</h2>
          <div className="flex flex-col gap-2">
            {unallocatedWallets.map((wallet) => {
              const isLoanWallet = wallet.type === "LOAN"
              const isPlusAccount =
                user?.type === "PLUS" || user?.hasActiveMembership
              const isLoanDisabledByPlus = isLoanWallet && !isPlusAccount
              const isLoanDisabled = isLoanWallet && isLoanOptionDisabled
              const isLoanDisabledByCircle =
                isLoanWallet && isPlusAccount && isLoanOptionDisabled

              return (
                <Item
                  key={wallet.id}
                  asChild
                  variant="outline"
                  className={
                    isLoanDisabled
                      ? "bg-muted cursor-not-allowed"
                      : "bg-card cursor-pointer hover:border-primary"
                  }
                >
                  <div
                    onClick={() => {
                      if (!isLoanDisabled) handleWalletClick(wallet.id)
                    }}
                  >
                    <ItemMedia
                      className={`rounded-lg bg-transparent ${isLoanDisabled ? "opacity-50" : ""}`}
                    >
                      {wallet.type === "MPESA" && (
                        <Smartphone className="w-6 h-6 text-muted-foreground" />
                      )}
                      {wallet.type === "CASHBACK" && (
                        <Percent className="w-6 h-6 text-muted-foreground" />
                      )}
                      {wallet.type === "LOAN" && (
                        <Clock2 className="w-6 h-6 text-muted-foreground" />
                      )}
                    </ItemMedia>
                    <ItemContent>
                      <div className={isLoanDisabled ? "opacity-50" : ""}>
                        <ItemTitle
                          className={`text-sm font-medium ${isLoanDisabled ? "text-muted-foreground" : "text-foreground"}`}
                        >
                          {getWalletTitle(wallet)}
                        </ItemTitle>
                        {getWalletBalanceDescription(wallet) && (
                          <ItemDescription className="text-sm text-muted-foreground">
                            {getWalletBalanceDescription(wallet)}
                          </ItemDescription>
                        )}
                      </div>
                      {isLoanDisabled && (
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          {isLoanDisabledByPlus ? (
                            <>
                              <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                              <p className="text-sm text-muted-foreground">
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
                    </ItemContent>
                    <ItemActions>
                      {!isLoanDisabled ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="bg-purple-100 hover:bg-purple-200 shrink-0"
                          aria-label={`Add ${getWalletName(wallet.type)} as a source of funds`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleWalletClick(wallet.id)
                          }}
                        >
                          <Plus className="w-5 h-5 text-primary" />
                        </Button>
                      ) : isLoanDisabledByCircle ? (
                        <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : null}
                    </ItemActions>
                  </div>
                </Item>
              )
            })}
          </div>
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
