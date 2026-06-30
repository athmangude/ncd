import { Eye, EyeOff } from "lucide-react"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Progress } from "@/components/Progress"
import logoIcon from "@/assets/icons/logo-layered.png"
import frozenLock from "@/assets/icons/frozen-card-lock.svg"
import loansCardBackground from "@/assets/images/loans-card-background.png"
import lockedCardBackground from "@/assets/images/locked-card-background.png"
import frozenOverlay from "@/assets/images/frozen-card-overlay.png"
import { ChipIcon } from "./ChipIcon"
import { usePersistentBalance } from "@/hooks/usePersistentBalance"
import { LoanStats } from "@/types/LoanStats"
import { Skeleton } from "@/components/Skeleton"

interface LoansCardProps {
  loans?: any[]
  loanStats?: LoanStats | null
  isLocked?: boolean
  onUpgrade?: () => void
  isLoading?: boolean
}

export function LoansCard({
  loanStats,
  isLocked = false,
  onUpgrade,
  isLoading,
}: LoansCardProps) {
  const { showBalance, toggleBalance } = usePersistentBalance(
    "loansBalanceVisible"
  )

  if (isLoading) {
    return (
      <Skeleton className="w-full h-48 sm:h-52 rounded-[1.5rem] sm:rounded-[2rem]" />
    )
  }

  const currencyCode = loanStats?.currency || "KES"
  const remainingCreditLimit = loanStats?.remainingCreditLimit ?? 0
  const outstandingAmount = loanStats?.outstandingAmount ?? 0
  const totalPaid = loanStats?.totalPaid ?? 0

  const totalLoanValue = outstandingAmount + totalPaid
  const progress = totalLoanValue > 0 ? (totalPaid / totalLoanValue) * 100 : 0

  if (isLocked) {
    return (
      <div className="flex flex-col gap-4" onClick={onUpgrade}>
        <div className="relative w-full aspect-[1.586] rounded-[clamp(1.5rem,1.35rem+0.75vw,2rem)] overflow-hidden shadow-xl shadow-neutral-300 transition-all duration-300 hover:shadow-2xl hover:shadow-neutral-400/50 cursor-pointer hover:opacity-95">
          {/* Muted grey base */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-luminosity opacity-50 bg-neutral-700 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${lockedCardBackground})` }}
          />

          {/* Cracked glass overlay */}
          <div
            aria-hidden
            className="absolute inset-0 mix-blend-overlay pointer-events-none bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${frozenOverlay})` }}
          />

          {/* Contrast scrim — boosts text legibility over the cracked grey */}
          <div
            aria-hidden
            className="absolute inset-0 bg-black/25 pointer-events-none"
          />

          {/* Card content — at full opacity, not affected by blend modes */}
          <div className="relative z-10 flex flex-col h-full justify-between p-[clamp(1.25rem,1.15rem+0.5vw,1.5rem)] text-white drop-shadow-md">
            <div className="flex justify-between items-start">
              <div className="bg-white/25 backdrop-blur-md py-[clamp(0.25rem,0.2rem+0.25vw,0.375rem)] px-[clamp(0.75rem,0.65rem+0.5vw,1rem)] rounded-full text-[clamp(10px,9px+0.5vw,12px)] font-semibold tracking-wide border border-white/20 uppercase">
                LOANS
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
              <div className="mb-1 opacity-90">
                <ChipIcon
                  style={{
                    width: "clamp(36px, 34px + 1vw, 45px)",
                    height: "clamp(28px, 26.5px + 0.75vw, 35px)",
                  }}
                />
              </div>
              <p className="text-white font-semibold text-[clamp(12px,11px+0.5vw,14px)]">
                Available to Borrow
              </p>
              <div className="flex items-center gap-3">
                <h2 className="font-mono font-bold tracking-tight leading-none text-white text-[clamp(24px,22px+1vw,30px)]">
                  {showBalance
                    ? formatMoney(remainingCreditLimit, currencyCode)
                    : "KES ****"}
                </h2>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleBalance()
                  }}
                  className="text-white/90 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
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
              <p className="text-white font-medium text-[clamp(12px,11px+0.5vw,14px)] mt-[clamp(0.125rem,0.1rem+0.125vw,0.25rem)]">
                Total to repay:{" "}
                <span className="font-mono">
                  {showBalance
                    ? formatMoney(outstandingAmount, currencyCode)
                    : "KES ****"}
                </span>
              </p>
            </div>
          </div>

          {/* 3D padlock badge */}
          <img
            src={frozenLock}
            alt="Locked — tap to upgrade"
            className="absolute z-20 top-[clamp(0.875rem,0.8rem+0.375vw,1.125rem)] right-[clamp(0.875rem,0.8rem+0.375vw,1.125rem)] w-[clamp(2rem,1.85rem+0.75vw,2.75rem)] h-auto pointer-events-none drop-shadow-lg"
          />
        </div>

        {outstandingAmount > 0 && (
          <div className="flex flex-col gap-3 px-1">
            <Progress
              value={progress}
              className="h-2 bg-purple-200"
              indicatorClassName="bg-[#A855F7]"
            />
            <div className="flex justify-between text-sm font-medium">
              <span className="text-neutral-600">
                Paid:{" "}
                <span className="text-neutral-900">
                  {formatMoney(totalPaid, currencyCode)}
                </span>
              </span>
              <span className="text-neutral-600">
                Due:{" "}
                <span className="text-neutral-900">
                  {formatMoney(outstandingAmount, currencyCode)}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative w-full aspect-[1.586] rounded-[clamp(1.5rem,1.35rem+0.75vw,2rem)] p-[clamp(1.25rem,1.15rem+0.5vw,1.5rem)] text-white overflow-hidden shadow-xl shadow-blue-200 bg-cover bg-center bg-no-repeat transition-all duration-300 hover:shadow-2xl hover:shadow-blue-300/50 bg-blue-600 flex flex-col"
        style={{ backgroundImage: `url(${loansCardBackground})` }}
      >
        {/* Card Content */}
        <div className="relative z-10 flex flex-col flex-grow justify-between">
          <div className="flex justify-between items-start">
            <div className="bg-white/20 backdrop-blur-md py-[clamp(0.25rem,0.2rem+0.25vw,0.375rem)] px-[clamp(0.75rem,0.65rem+0.5vw,1rem)] rounded-full text-[clamp(10px,9px+0.5vw,12px)] font-medium tracking-wide border border-white/10 uppercase">
              LOANS
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
                width="80"
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
            <p className="text-white font-medium text-[clamp(12px,11px+0.5vw,14px)]">
              Available to borrow
            </p>
            <div className="flex items-center gap-3">
              <h2 className="text-white font-mono font-bold tracking-tight leading-none text-[clamp(24px,22px+1vw,30px)]">
                {showBalance
                  ? formatMoney(remainingCreditLimit, currencyCode)
                  : "KES ****"}
              </h2>
              <button
                onClick={toggleBalance}
                className="text-white hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
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
            <p className="text-white text-[clamp(12px,11px+0.5vw,14px)] mt-[clamp(0.125rem,0.1rem+0.125vw,0.25rem)]">
              Total to repay{" "}
              <span className="font-mono">
                {showBalance
                  ? formatMoney(outstandingAmount, currencyCode)
                  : "KES ****"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {outstandingAmount > 0 && (
        <div className="flex flex-col gap-3 px-1">
          <Progress
            value={progress}
            className="h-2 bg-purple-200"
            indicatorClassName="bg-[#A855F7]"
          />
          <div className="flex justify-between text-sm font-medium">
            <span className="text-neutral-600">
              Paid:{" "}
              <span className="text-neutral-900">
                {formatMoney(totalPaid, currencyCode)}
              </span>
            </span>
            <span className="text-neutral-600">
              Due:{" "}
              <span className="text-neutral-900">
                {formatMoney(outstandingAmount, currencyCode)}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
