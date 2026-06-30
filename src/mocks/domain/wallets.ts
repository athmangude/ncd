/**
 * Wallet domain helpers.
 *
 * The participant's four wallets (M-Pesa, Loan, Cashback, Card) live as an array
 * on the profile (`login-details.wallets`). The Facilitator Tools panel edits
 * their balances directly, so the read/write logic lives here — one place that
 * finds a wallet by type and writes a clamped, stringified balance back.
 */

import { getLoginDetails, patchLoginDetails } from "../handlers/profile"

export type WalletType = "MPESA" | "LOAN" | "CASHBACK" | "CARD"

interface Wallet {
  id: string
  type: string
  remainingBalance: string
  createdAt: string
  updatedAt: string
}

/** Current balance of a wallet as a number (the profile holds it as a string). */
export function getWalletBalance(type: WalletType): number {
  const wallets = (getLoginDetails().wallets ?? []) as Wallet[]
  const wallet = wallets.find((item) => item.type === type)
  return Number(wallet?.remainingBalance ?? 0)
}

/** Set a wallet's balance to an exact amount (clamped at 0). Returns the new value. */
export function setWalletBalance(type: WalletType, amount: number): number {
  const next = Math.max(0, Math.round(amount))
  const profile = getLoginDetails()
  const wallets = ((profile.wallets ?? []) as Wallet[]).map((wallet) =>
    wallet.type === type
      ? {
          ...wallet,
          remainingBalance: String(next),
          updatedAt: new Date().toISOString(),
        }
      : wallet
  )
  patchLoginDetails({ wallets })
  return next
}
