import { formatDate } from "@/utilities/dateUtilities"
import { InfoLink } from "./InfoLink"
import rewardIcon from "@/assets/icons/reward.png"
import { formatMoney } from "@/utilities/currencyUtilities"

export default function EarnCareFundCTA({
  careFundPotentialAmount,
  loanDueDate,
  currency,
}: {
  careFundPotentialAmount: number
  loanDueDate: Date
  currency: string
}) {
  if (careFundPotentialAmount == 0) {
    return null
  }

  return (
    <InfoLink
      href="/patients/care-fund"
      icon={rewardIcon}
      title={`Earn ${formatMoney(careFundPotentialAmount, currency)} when you repay before ${formatDate(loanDueDate)}!`}
      description="Share Jireh now"
      variant="emphasized"
    />
  )
}
