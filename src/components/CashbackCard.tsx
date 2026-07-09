import { usePatientAuthStore } from "@/Routes/Patient/stores/patientAuthStore"
import {
  HistoryCard,
  CashbackEntry,
  resolveCashbackLabel,
} from "@/components/HistoryCard"

/**
 * Canonical cashback / care-fund transaction card.
 *
 * A thin composition over the shared history atoms: a single-entry
 * `HistoryCard`. The same `CashbackEntry` atom is reused inside payment cards,
 * so a cashback row looks identical everywhere it appears.
 */

export interface CashbackTransaction {
  id: string
  transactionAmount: number
  currency: { code: string; symbol?: string; name?: string }
  type: "TRANSFER" | "EARNED" | "SPENT" | string
  sender?: {
    accountOwner?: { id: string; firstName?: string; lastName?: string }
  } | null
  receiver?: {
    accountOwner?: { id: string; firstName?: string; lastName?: string }
  } | null
  description?: string | null
  createdAt: string
}

export function CashbackCard({
  transaction,
}: {
  transaction: CashbackTransaction
}) {
  const user = usePatientAuthStore((state: any) => state.user)

  const who = {
    isReceiver: transaction.receiver?.accountOwner?.id === user?.id,
    isSender: transaction.sender?.accountOwner?.id === user?.id,
  }

  return (
    <HistoryCard>
      <CashbackEntry
        type={transaction.type}
        label={resolveCashbackLabel(transaction, who)}
        amount={transaction.transactionAmount}
        currency={transaction.currency.code}
        createdAt={transaction.createdAt}
        who={who}
      />
    </HistoryCard>
  )
}
