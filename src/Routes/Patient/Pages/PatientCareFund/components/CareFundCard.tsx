import { Eye, EyeOff } from "lucide-react"
import { Amount } from "@/components/Amount"
import logoIcon from "@/assets/icons/logo-layered.png"
import carefundCardBackground from "@/assets/images/carefund-card-background.png"
import { ChipIcon } from "../../Dashboard/components/ChipIcon"
import { usePersistentBalance } from "@/hooks/usePersistentBalance"
import { usePaymentHistory } from "@/Routes/Patient/hooks/usePaymentHistory"
import { Skeleton } from "@/components/Skeleton"

export function CareFundCard() {
  const { showBalance, toggleBalance } = usePersistentBalance(
    "careFundBalanceVisible"
  )
  const { data: paymentHistory, isLoading } = usePaymentHistory()
  const { careFundAccount } = paymentHistory || {}

  const { careFundBalance, currency } = careFundAccount || {}
  const currencyCode = currency?.code || "KES"
  // Use raw balance (no rounding) for display so card shows exact care fund balance
  const rawBalance =
    careFundBalance != null ? parseFloat(String(careFundBalance)) : undefined

  if (isLoading) {
    return (
      <Skeleton className="w-full h-48 sm:h-52 rounded-[1.5rem] sm:rounded-[2rem]" />
    )
  }

  return (
    <div
      className="relative w-full aspect-[1.586] rounded-[var(--fluid-card-radius)] p-[var(--fluid-card-padding)] text-white overflow-hidden bg-cover bg-center bg-no-repeat flex flex-col"
      style={{ backgroundImage: `url(${carefundCardBackground})` }}
    >
      {/* Card Content */}
      <div className="relative z-10 flex flex-col flex-grow justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-white/20 backdrop-blur-md py-[var(--fluid-badge-py)] px-[var(--fluid-badge-px)] rounded-full text-[length:var(--fluid-badge-text)] font-medium tracking-wide border border-white/10 uppercase">
            Cashback
          </div>
          <img
            src={logoIcon}
            alt="Jireh Logo"
            width="40"
            className="h-auto"
          />
        </div>

        <div className="flex flex-col mt-auto gap-[var(--fluid-card-gap)]">
          {/* Chip Icon */}
          <div className="mb-1 opacity-80">
            <ChipIcon
              style={{
                width: "var(--fluid-logo-size)",
                height: "var(--fluid-logo-height)",
              }}
            />
          </div>
          <p className="text-white/90 font-medium text-[length:var(--fluid-label-text)]">
            Cashback balance
          </p>
          <div className="flex items-center gap-3">
            {showBalance ? (
              <Amount
                value={rawBalance ?? 0}
                currency={currencyCode}
                includeDecimals
                size="hero"
                weight="bold"
                className="text-white"
              />
            ) : (
              <span className="font-mono font-bold tracking-tight leading-none text-white text-[length:var(--fluid-amount-text)]">
                KES ****
              </span>
            )}
            <button
              onClick={toggleBalance}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              {showBalance ? (
                <EyeOff
                  style={{
                    width: "var(--fluid-icon-size)",
                    height: "var(--fluid-icon-size)",
                  }}
                />
              ) : (
                <Eye
                  style={{
                    width: "var(--fluid-icon-size)",
                    height: "var(--fluid-icon-size)",
                  }}
                />
              )}
            </button>
          </div>
          <p className="text-white/80 text-[length:var(--fluid-label-text)] mt-[var(--fluid-card-gap)]">
            Use the discounts to make a payment
          </p>
        </div>
      </div>
    </div>
  )
}
