import { useRef, useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/Drawer"
import { Button } from "@/components/Button"
import { Alert, AlertDescription } from "@/components/Alert"
import { AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatMoney } from "@/utilities/currencyUtilities"
import { CashbackBanner } from "@/components/CashbackBanner"
import FormGroupInput from "@/components/form/FormGroupInput"
import { RepaymentPeriodInput } from "./PatientLoanTerms"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/Popover"
import { Allocations, ExtendedUser, WalletItem, getWalletName } from "./types"
import { trackEvent, EVENTS, safeAmount } from "@/analytics"

interface WalletDrawerProps {
  isOpen: boolean
  onClose: () => void
  wallet: WalletItem | undefined
  onSave: (
    amount: number,
    repaymentPeriodDays?: number,
    phoneNumber?: string
  ) => void
  totalBillAmount: number
  allocations: Allocations
  totalAllocated: number
  user: ExtendedUser
  isNetworkFacility?: boolean
  careFundBalance?: number | string | null
  careFundCurrency?: string
}

export function WalletDrawer({
  isOpen,
  onClose,
  wallet,
  onSave,
  totalBillAmount,
  allocations,
  totalAllocated: _totalAllocated, // Not used - we calculate from allocations directly
  user,
  isNetworkFacility = false,
  careFundBalance: careFundBalanceProp,
  careFundCurrency = "KES",
}: WalletDrawerProps) {
  // All hooks must run unconditionally and in the same order on every render
  // (react-hooks/rules-of-hooks). Early returns happen after the hook calls below.
  const navigate = useNavigate()
  const allocation = wallet ? allocations[wallet.id] : undefined

  const form = useForm<{
    amount: number | string
    repaymentPeriodDays?: number
    phoneNumber?: string
  }>({
    mode: "onChange",
    defaultValues: {
      amount: allocation?.amount || "",
      repaymentPeriodDays: allocation?.repaymentPeriodDays,
      phoneNumber: allocation?.phoneNumber || user.phoneNumber || "",
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors, isValid },
  } = form

  // Sync form with allocation only when drawer opens (or wallet changes), so user edits are not overwritten by parent re-renders
  const prevOpenRef = useRef(false)
  const DEFAULT_LOAN_REPAYMENT_DAYS = 31
  useEffect(() => {
    if (isOpen && wallet) {
      const allocation = allocations[wallet.id]
      const justOpened = !prevOpenRef.current
      prevOpenRef.current = true
      if (justOpened && allocation && allocation.type !== "DISCOUNT") {
        setValue("amount", allocation.amount ?? "")
        setValue(
          "repaymentPeriodDays",
          allocation.repaymentPeriodDays ?? DEFAULT_LOAN_REPAYMENT_DAYS
        )
        if (wallet.type === "MPESA") {
          setValue(
            "phoneNumber",
            allocation.phoneNumber || user.phoneNumber || ""
          )
        }
      } else if (justOpened && wallet.type === "LOAN") {
        // New LOAN allocation: set default repayment period so it is always sent in the payload
        setValue(
          "repaymentPeriodDays",
          allocation?.repaymentPeriodDays ?? DEFAULT_LOAN_REPAYMENT_DAYS
        )
      }
    } else {
      prevOpenRef.current = false
    }
    // Trigger on wallet identity change, not on wallet object reference churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, wallet?.id, allocations, setValue, user.phoneNumber])

  const watchAmount = watch("amount")
  const [showCreditLimitTooltip, setShowCreditLimitTooltip] = useState(false)
  const [hasExceededLimit, setHasExceededLimit] = useState(false)

  // Derived values used below; safe even when wallet is undefined
  const hasUploadedMpesaStatement = user?.hasUploadedMpesaStatement || false
  const remainingAmount = Number(user?.creditLimit?.remainingAmount || 0)
  const totalCreditLimitAmount = Number(
    user?.creditLimit?.totalCreditLimitAmount || 0
  )
  const DEFAULT_MAX_CREDIT_LIMIT = 6000 // fallback when totalCreditLimitAmount not from API

  // Calculate otherAllocated excluding discount allocations
  // Discount is already subtracted from totalBillAmount, so we shouldn't count it in remaining
  const otherAllocated = wallet
    ? Object.values(allocations).reduce((sum, alloc) => {
        if (alloc.type === "DISCOUNT" || alloc.walletId === wallet.id) {
          return sum
        }
        return sum + alloc.amount
      }, 0)
    : 0
  const remainingToAllocate = Math.max(0, totalBillAmount - otherAllocated)

  let maxAmount = remainingToAllocate
  let balanceLabel = "Balance"
  let balanceAmount = 0

  if (wallet?.type === "CASHBACK") {
    // Use same balance source as CareFundCard: payment-history careFundAccount.
    // Use parseFloat for raw balance (no rounding) so display and validation use exact balance.
    const rawCareFundBalance =
      careFundBalanceProp !== undefined && careFundBalanceProp !== null
        ? parseFloat(String(careFundBalanceProp))
        : parseFloat(String(wallet.remainingBalance))
    balanceAmount = Number.isNaN(rawCareFundBalance) ? 0 : rawCareFundBalance
    maxAmount = Math.min(maxAmount, balanceAmount)
    balanceLabel = "Care Fund Balance"
  } else if (wallet?.type === "LOAN") {
    // remainingAmount is "available to borrow" and the maximum loan amount the user can request
    balanceAmount = remainingAmount
    maxAmount = Math.min(remainingToAllocate, balanceAmount)
    balanceLabel = "Available to borrow"
  }

  // Show tooltip when loan amount exceeds limit (do not cap here so user can freely edit; we cap on submit)
  useEffect(() => {
    if (
      wallet?.type === "LOAN" &&
      watchAmount !== undefined &&
      watchAmount !== ""
    ) {
      const amount = Number(watchAmount)
      if (amount > maxAmount && !hasUploadedMpesaStatement) {
        setHasExceededLimit(true)
        setShowCreditLimitTooltip(true)
      } else {
        setHasExceededLimit(false)
        if (amount <= maxAmount) {
          setShowCreditLimitTooltip(false)
        }
      }
    } else {
      setHasExceededLimit(false)
      setShowCreditLimitTooltip(false)
    }
  }, [watchAmount, maxAmount, wallet?.type, hasUploadedMpesaStatement])

  if (!wallet) return null
  // Prevent drawer from opening for discount wallet
  if (wallet.type === "DISCOUNT" || wallet.type === "DISCOUNTS") {
    return null
  }
  if (allocation?.type === "DISCOUNT") {
    return null
  }

  // UPDATED: OnSubmit handles phone number
  const onSubmit = (data: {
    amount: number | string
    repaymentPeriodDays?: number
    phoneNumber?: string
  }) => {
    // Ensure amount doesn't exceed limit
    const finalAmount = Math.min(Number(data.amount), maxAmount)

    try {
      trackEvent(EVENTS.PAYMENT.WALLET_ALLOCATE, {
        walletType: wallet.type,
        amount: safeAmount(finalAmount),
        repaymentPeriodDays: data.repaymentPeriodDays,
      })
    } catch {
      // Silent fail
    }

    onSave(finalAmount, data.repaymentPeriodDays, data.phoneNumber)
  }

  const getDrawerTitle = () => {
    if (wallet.type === "LOAN") {
      return (
        <>
          Enter amount to borrow and repay as a{" "}
          <span className="text-primary font-semibold">Jireh Medical Loan</span>
        </>
      )
    }

    if (wallet.type === "CASHBACK") {
      return (
        <>
          Enter amount to deduct from your{" "}
          <span className="text-primary font-semibold">Jireh Care Fund</span>
        </>
      )
    }

    // Prevent showing drawer for discount type (should never happen, but safety check)
    if ((wallet as any).type === "DISCOUNT") {
      return null
    }

    const name = wallet.type === "MPESA" ? "MPESA" : getWalletName(wallet.type)
    return (
      <>
        Enter amount to deduct from your{" "}
        <span className="text-primary font-semibold">{name}</span>
      </>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DrawerHeader>
            <div className="flex flex-col items-center gap-4">
              <DrawerTitle>{getDrawerTitle()}</DrawerTitle>
              <DrawerDescription className="sr-only">
                Adjust the amount you want to pay using this wallet
              </DrawerDescription>
              <div className="bg-muted px-4 py-2 rounded-full text-sm font-medium text-muted-foreground">
                Remaining to allocate {formatMoney(remainingToAllocate, "KES")}
              </div>
            </div>
          </DrawerHeader>

          <div className="py-6 flex flex-col gap-6">
            {/* Amount Input */}
            <div className="flex flex-col gap-2">
              <FormGroupInput
                id="amount"
                label="Amount"
                type="number"
                prefix="KES"
                className={cn(
                  showCreditLimitTooltip &&
                    wallet.type === "LOAN" &&
                    "[&_[data-slot=input-group]]:border-warning"
                )}
                placeholder="000,000"
                register={register("amount", {
                  required: "Amount is required",
                  min: { value: 0, message: "Amount cannot be negative" },
                  max: {
                    value: maxAmount,
                    message: `Cannot exceed ${formatMoney(maxAmount, wallet.type === "CASHBACK" ? careFundCurrency : "KES", wallet.type === "CASHBACK")}`,
                  },
                  onChange: (e) => {
                    const value = Number(e.target.value)
                    if (
                      wallet.type === "LOAN" &&
                      value > maxAmount &&
                      !hasUploadedMpesaStatement
                    ) {
                      setShowCreditLimitTooltip(true)
                    } else if (value <= maxAmount) {
                      setShowCreditLimitTooltip(false)
                    }
                  },
                })}
                error={errors.amount?.message}
              />
              {showCreditLimitTooltip &&
                wallet.type === "LOAN" &&
                !errors.amount && (
                  <p className="text-sm text-warning-solid flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Amount capped at {formatMoney(maxAmount, "KES")}. Upload
                    M-Pesa statement to increase limit.
                  </p>
                )}
            </div>

            {/* UPDATED: MPESA Phone Number Input */}
            {wallet.type === "MPESA" && (
              <div className="flex flex-col gap-4">
                <FormGroupInput
                  id="mpesaPhoneNumber"
                  label="M-Pesa Phone Number"
                  type="tel"
                  inputMode="tel"
                  placeholder="07XX XXX XXX"
                  register={register("phoneNumber", {
                    required: "Phone number is required for M-Pesa",
                    pattern: {
                      value:
                        /^(?:254|\+254|0)?((?:7|1)(?:(?:[0-9][0-9])|(?:[0-9][0-9]))[0-9]{6})$/,
                      message: "Please enter a valid Kenyan phone number",
                    },
                  })}
                  error={errors.phoneNumber?.message}
                  sensitive
                />
                {/* Cashback Banner for MPESA */}
                <CashbackBanner
                  visible={isNetworkFacility}
                  title="Pay via Jireh and earn cashback!"
                  description={`You will earn ${formatMoney(Number(watchAmount || 0) * 0.05, "KES")} cashback when you make this payment!`}
                />
              </div>
            )}

            {wallet.type === "CASHBACK" && (
              <p className="text-muted-foreground text-sm">
                {balanceLabel}:{" "}
                {formatMoney(balanceAmount, careFundCurrency, true)}
              </p>
            )}

            {wallet.type === "LOAN" && (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-sm">
                    {balanceLabel}: {formatMoney(balanceAmount, "KES")}
                  </p>
                  {/*
                   * The "raise your limit" upsell intentionally lives only in
                   * this compact (i) popover beside the balance line — the
                   * large amber card used to push the repayment input and
                   * Save/Cancel CTAs off-screen on short viewports (e.g.
                   * 320×640). The popover keeps the same Upload M-Pesa
                   * Statement path without the height.
                   */}
                  {!hasUploadedMpesaStatement && (
                    <Popover
                      open={showCreditLimitTooltip && hasExceededLimit}
                      onOpenChange={(open) => {
                        if (open && hasExceededLimit) {
                          setShowCreditLimitTooltip(true)
                        } else if (!open) {
                          setShowCreditLimitTooltip(false)
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            "inline-flex items-center justify-center focus:outline-none transition-colors",
                            hasExceededLimit
                              ? "text-warning-solid hover:text-warning-solid/80"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                          aria-label="Credit limit information"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="max-w-sm text-sm border-warning leading-relaxed"
                        side="top"
                        align="start"
                        sideOffset={5}
                        style={{ width: "auto", maxWidth: "24rem" }}
                      >
                        <div className="flex flex-col gap-2">
                          <p className="font-medium text-foreground">
                            Your interest-free limit is currently{" "}
                            {formatMoney(remainingAmount, "KES")}.
                          </p>
                          <p className="text-muted-foreground">
                            To borrow up to{" "}
                            {formatMoney(
                              totalCreditLimitAmount ||
                                DEFAULT_MAX_CREDIT_LIMIT,
                              "KES"
                            )}{" "}
                            for this bill, please upload an M-Pesa statement.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => {
                              navigate(
                                "/patients/financial-statements-with-credit-update",
                                {
                                  state: {
                                    returnTo:
                                      "/patients/payment/request-payment/wallet-selection",
                                    returnState: {
                                      totalBillAmount: totalBillAmount,
                                      allocations: allocations,
                                      kmpdcFacility: (user as any)
                                        ?.kmpdcFacility,
                                    },
                                  },
                                }
                              )
                              onClose()
                            }}
                          >
                            Upload M-Pesa Statement
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>

                <CashbackBanner
                  visible={isNetworkFacility}
                  title=""
                  description={
                    <span className="text-foreground">
                      You will earn{" "}
                      <span className="font-bold">
                        {" "}
                        {formatMoney(Number(watchAmount || 0) * 0.05, "KES")}
                      </span>{" "}
                      cashback when you repay this loan!
                    </span>
                  }
                />

                <div className="flex flex-col gap-2">
                  <RepaymentPeriodInput
                    control={control}
                    errors={errors}
                    loanAmount={Number(watchAmount)}
                    totalBillAmount={totalBillAmount}
                    repaymentPeriodDays={watch("repaymentPeriodDays") || 0}
                  />
                </div>

                <Alert variant="warning" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs leading-relaxed">
                    If your loan payment is delayed, there will be a penalty fee
                    of {formatMoney(Number(watchAmount || 0) * 0.1, "KES")}
                  </AlertDescription>
                </Alert>
              </>
            )}
          </div>

          <DrawerFooter className="gap-3 sticky bottom-0 bg-background border-t border-border">
            <Button type="submit" disabled={!isValid} className="w-full">
              Save
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
