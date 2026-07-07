import { Eye, EyeOff } from "lucide-react"
import { formatMoney } from "@/utilities/currencyUtilities"
import { Amount } from "@/components/Amount"
import { Button } from "@/components/Button"
import logoIcon from "@/assets/icons/logo-layered.png"
import frozenLock from "@/assets/icons/frozen-card-lock.svg"
import cardBackground from "@/assets/images/card-background.png"
import lockedCardBackground from "@/assets/images/locked-card-background.png"
import frozenOverlay from "@/assets/images/frozen-card-overlay.png"
import { ChipIcon } from "./ChipIcon"
import { usePersistentBalance } from "@/hooks/usePersistentBalance"
import { LoanStats } from "@/types/LoanStats"
import { Skeleton } from "@/components/Skeleton"

interface BalanceCardProps {
  loanStats?: LoanStats | null
  /**
   * Borrowing is not yet unlocked (no active membership). The card renders
   * normally but its coloured background is desaturated — an invitation to
   * upgrade, not a broken state.
   */
  isLocked?: boolean
  /**
   * Borrowing has been revoked (account/circle frozen — e.g. default). This is
   * the only state that shows the frozen, cracked-glass overlay.
   */
  isFrozen?: boolean
  onUpgrade?: () => void
  isLoading?: boolean
}

export function BalanceCard({
  loanStats,
  isLocked = false,
  isFrozen = false,
  onUpgrade,
  isLoading,
}: BalanceCardProps) {
  const { showBalance, toggleBalance } = usePersistentBalance(
    "paymentsBalanceVisible"
  )

  if (isLoading) {
    return (
      <Skeleton className="w-full h-48 sm:h-52 rounded-[1.5rem] sm:rounded-[2rem]" />
    )
  }

  const currencyCode = loanStats?.currency || "KES"
  const remainingCreditLimit = loanStats?.remainingCreditLimit ?? 0
  const outstandingAmount = loanStats?.outstandingAmount ?? 0

  if (isFrozen) {
    return (
      <div
        onClick={onUpgrade}
        className="relative w-full aspect-[1.586] rounded-[var(--fluid-card-radius)] overflow-hidden shadow-xl shadow-muted-foreground transition-all duration-300 hover:shadow-2xl hover:shadow-muted-foreground/50 cursor-pointer hover:opacity-95"
      >
        {/* Muted grey base */}
        <div
          aria-hidden
          className="absolute inset-0 mix-blend-luminosity opacity-50 bg-muted-foreground bg-cover bg-center bg-no-repeat"
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
        <div className="relative z-10 flex flex-col h-full justify-between p-[var(--fluid-card-padding)] text-white drop-shadow-md">
          <div className="flex justify-between items-start">
            <div className="bg-white/25 backdrop-blur-md py-[var(--fluid-badge-py)] px-[var(--fluid-badge-px)] rounded-full text-[length:var(--fluid-badge-text)] font-semibold tracking-wide border border-white/20 uppercase">
              Payments
            </div>
            <img
              src={logoIcon}
              alt="Jireh Logo"
              width="40"
              className="h-auto"
            />
          </div>

          <div className="flex flex-col mt-auto gap-[var(--fluid-card-gap)]">
            <div className="mb-1 opacity-90">
              <ChipIcon
                style={{
                  width: "var(--fluid-logo-size)",
                  height: "var(--fluid-logo-height)",
                }}
              />
            </div>
            <p className="text-white font-semibold text-[length:var(--fluid-label-text)]">
              Available balance
            </p>
            <div className="flex items-center gap-3">
              {showBalance ? (
                <Amount
                  value={remainingCreditLimit}
                  currency={currencyCode}
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
                onClick={(e) => {
                  e.stopPropagation()
                  toggleBalance()
                }}
                className="text-white/90 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
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
            <p className="text-white font-medium text-[length:var(--fluid-label-text)] mt-[var(--fluid-card-gap)]">
              Including{" "}
              <span className="font-mono">
                {showBalance
                  ? formatMoney(outstandingAmount, currencyCode)
                  : "KES ****"}
              </span>{" "}
              loan
            </p>
          </div>
        </div>

        {/* 3D padlock badge */}
        <img
          src={frozenLock}
          alt="Locked — tap to upgrade"
          className="absolute z-20 top-[var(--fluid-corner-offset)] right-[var(--fluid-corner-offset)] w-[var(--fluid-corner-icon)] h-auto pointer-events-none drop-shadow-lg"
        />
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-[1.586] rounded-[var(--fluid-card-radius)] p-[var(--fluid-card-padding)] text-white overflow-hidden flex flex-col">
      {/* Background — until borrowing is unlocked (isLocked) the card uses the
          neutral grey art, so it reads as "available, not yet active" rather
          than broken (the cracked-glass frozen overlay is reserved for the
          revoked / defaulted state above). */}
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${
            isLocked ? lockedCardBackground : cardBackground
          })`,
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 flex flex-col flex-grow justify-between">
        <div className="flex justify-between items-start">
          <div className="bg-white/20 backdrop-blur-md py-[var(--fluid-badge-py)] px-[var(--fluid-badge-px)] rounded-full text-[length:var(--fluid-badge-text)] font-medium tracking-wide border border-white/10 uppercase">
            Payments
          </div>
          <img src={logoIcon} alt="Jireh Logo" width="40" className="h-auto" />
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
          <p className="text-white font-medium text-[length:var(--fluid-label-text)]">
            Available Balance
          </p>
          <div className="flex items-center gap-3">
            {showBalance ? (
              <Amount
                value={remainingCreditLimit}
                currency={currencyCode}
                size="hero"
                weight="bold"
                className="text-white"
              />
            ) : (
              <span className="font-mono font-bold tracking-tight leading-none text-white text-[length:var(--fluid-amount-text)]">
                KES ****
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleBalance}
              aria-label={showBalance ? "Hide balance" : "Show balance"}
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
            </Button>
          </div>
          <p className="text-white text-[length:var(--fluid-label-text)] mt-[var(--fluid-card-gap)]">
            Outstanding Loan :{" "}
            <span className="font-mono">
              {formatMoney(outstandingAmount, currencyCode)}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
