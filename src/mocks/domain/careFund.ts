/**
 * Care-fund domain helpers — the single source of truth for the participant's
 * cashback balance and transaction ledger.
 *
 * The authoritative balance lives on the profile (`login-details`)
 * `careFundAccount.careFundBalance`. Every balance change goes through here so
 * the Care Fund card, the savings/gift screens, and the payment-history summary
 * never drift apart. The care-fund transaction ledger (earned / spent /
 * transfer) is owned here too; handlers read and write it through these
 * helpers instead of touching localStorage directly.
 */

import { makeId, readObject, writeObject } from "../db"
import { getLoginDetails, patchLoginDetails } from "../handlers/profile"
import txnSeed from "../fixtures/care-fund-transactions.json"

export const TRANSACTIONS_KEY = "care-fund-transactions"

interface AccountOwnerWrapper {
  accountOwner: { id: string; firstName: string; lastName: string }
}

export interface CareFundTxn {
  id: string
  transactionAmount: number
  currency: { code: string; symbol?: string; name?: string }
  type: "TRANSFER" | "EARNED" | "SPENT"
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED"
  sender: AccountOwnerWrapper | null
  receiver: AccountOwnerWrapper | null
  receiverPhoneNumber: string | null
  description: string | null
  loan: unknown | null
  createdAt: string
  updatedAt: string
  expiresAt: string | null
}

interface TransactionsData {
  transactions: CareFundTxn[]
}

const DEFAULT_CURRENCY = { code: "KES", symbol: "KSh", name: "Kenyan Shilling" }

/** All care-fund transactions, newest first (seeded from the fixture). */
export function getCareFundTransactions(): CareFundTxn[] {
  return readObject<TransactionsData>(TRANSACTIONS_KEY, txnSeed as TransactionsData)
    .transactions
}

export function setCareFundTransactions(transactions: CareFundTxn[]): void {
  writeObject<TransactionsData>(TRANSACTIONS_KEY, { transactions })
}

/** Current cashback balance as a number (the profile holds it as a string). */
export function getCareFundBalance(): number {
  const profile = getLoginDetails()
  return Number(profile.careFundAccount?.careFundBalance ?? 0)
}

/** Set the balance to an exact amount (clamped at 0). Returns the new value. */
export function setCareFundBalance(amount: number): number {
  const next = Math.max(0, Math.round(amount))
  const profile = getLoginDetails()
  if (profile.careFundAccount) {
    patchLoginDetails({
      careFundAccount: {
        ...profile.careFundAccount,
        careFundBalance: String(next),
        updatedAt: new Date().toISOString(),
      },
    })
  }
  return next
}

/** Apply a signed delta to the balance. Returns the new value. */
export function adjustCareFundBalance(delta: number): number {
  return setCareFundBalance(getCareFundBalance() + delta)
}

/** Prepend a transaction to the ledger, filling sensible defaults. */
export function addCareFundTransaction(txn: Partial<CareFundTxn>): CareFundTxn {
  const now = new Date().toISOString()
  const full: CareFundTxn = {
    id: makeId("cf-txn"),
    transactionAmount: 0,
    currency: DEFAULT_CURRENCY,
    type: "EARNED",
    status: "COMPLETED",
    sender: null,
    receiver: null,
    receiverPhoneNumber: null,
    description: null,
    loan: null,
    createdAt: now,
    updatedAt: now,
    expiresAt: null,
    ...txn,
  }
  setCareFundTransactions([full, ...getCareFundTransactions()])
  return full
}

/**
 * Earn cashback: raise the balance and record an EARNED transaction credited to
 * the current participant. No-op for non-positive amounts.
 */
export function earnCashback(amount: number, source: string): CareFundTxn | null {
  const rounded = Math.round(amount)
  if (rounded <= 0) return null

  adjustCareFundBalance(rounded)
  const profile = getLoginDetails()
  return addCareFundTransaction({
    transactionAmount: rounded,
    type: "EARNED",
    description: source,
    receiver: {
      accountOwner: {
        id: profile.id,
        firstName: profile.firstName,
        lastName: profile.lastName,
      },
    },
    receiverPhoneNumber: profile.phoneNumber,
  })
}

/** Earned / spent totals from completed ledger entries. */
export function getCareFundTotals(): {
  totalEarned: number
  totalSpent: number
} {
  let totalEarned = 0
  let totalSpent = 0
  for (const txn of getCareFundTransactions()) {
    if (txn.status !== "COMPLETED") continue
    if (txn.type === "EARNED") totalEarned += Number(txn.transactionAmount) || 0
    else if (txn.type === "SPENT")
      totalSpent += Number(txn.transactionAmount) || 0
  }
  return { totalEarned, totalSpent }
}

/**
 * The `careFundAccount` object the payment-history endpoint returns. Derived
 * from the profile balance + ledger totals so it can never drift from the
 * Care Fund card / savings screens, which read the same profile balance.
 * Exposes both `careFundBalance` (string, read by CareFundCard) and `balance`
 * (number) for any numeric consumer.
 */
export function buildCareFundAccountSummary(): Record<string, unknown> {
  const profile = getLoginDetails()
  const balance = getCareFundBalance()
  const { totalEarned, totalSpent } = getCareFundTotals()
  return {
    ...(profile.careFundAccount ?? {}),
    balance,
    careFundBalance: String(balance),
    totalEarned,
    totalSpent,
  }
}
