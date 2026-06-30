import { formatMoney } from "@/utilities/currencyUtilities"
import { Eye, EyeOff } from "lucide-react"
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
      className="relative w-full aspect-[1.586] rounded-[clamp(1.5rem,1.35rem+0.75vw,2rem)] p-[clamp(1.25rem,1.15rem+0.5vw,1.5rem)] text-white overflow-hidden shadow-xl shadow-neutral-200 bg-cover bg-center bg-no-repeat transition-all duration-300 hover:shadow-2xl hover:shadow-neutral-300/50 bg-neutral-900 flex flex-col"
      style={{ backgroundImage: `url(${carefundCardBackground})` }}
    >
      {/* Card Content */}
      <div className="relative z-10 flex flex-col flex-grow justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-white/20 backdrop-blur-md py-[clamp(0.25rem,0.2rem+0.25vw,0.375rem)] px-[clamp(0.75rem,0.65rem+0.5vw,1rem)] rounded-full text-[clamp(10px,9px+0.5vw,12px)] font-medium tracking-wide border border-white/10 uppercase">
            Cashback
          </div>
          <div
            className="origin-top-right"
            style={{
              transform: "scale(calc(0.9 + 0.1 * (100vw - 320px) / 520))",
            }}
          >
            <img
              src={logoIcon}
              alt="Jireh Logo"
              width="40"
              className="h-auto"
            />
          </div>
        </div>

        <div className="flex flex-col mt-auto gap-[clamp(0.125rem,0.1rem+0.125vw,0.25rem)]">
          {/* Chip Icon */}
          <div className="mb-1 opacity-80">
            <ChipIcon
              style={{
                width: "clamp(36px, 34px + 1vw, 45px)",
                height: "clamp(28px, 26.5px + 0.75vw, 35px)",
              }}
            />
          </div>
          <p className="text-white/90 font-medium text-[clamp(12px,11px+0.5vw,14px)]">
            Cashback balance
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-white font-mono font-bold tracking-tight leading-none text-[clamp(24px,22px+1vw,30px)]">
              {showBalance
                ? formatMoney(rawBalance ?? 0, currencyCode, true)
                : "KES ****"}
            </h2>
            <button
              onClick={toggleBalance}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              {showBalance ? (
                <EyeOff
                  style={{
                    width: "clamp(1rem, 0.95rem + 0.25vw, 1.25rem)",
                    height: "clamp(1rem, 0.95rem + 0.25vw, 1.25rem)",
                  }}
                />
              ) : (
                <Eye
                  style={{
                    width: "clamp(1rem, 0.95rem + 0.25vw, 1.25rem)",
                    height: "clamp(1rem, 0.95rem + 0.25vw, 1.25rem)",
                  }}
                />
              )}
            </button>
          </div>
          <p className="text-white/80 text-[clamp(12px,11px+0.5vw,14px)] mt-[clamp(0.125rem,0.1rem+0.125vw,0.25rem)]">
            Use the discounts to make a payment
          </p>
        </div>
      </div>
    </div>
  )
}
