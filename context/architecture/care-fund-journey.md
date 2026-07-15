---
context_version: 1.0
last_updated_commit: 14d2d4e9
last_updated_date: 2026-04-08
covers: Care Fund (cashback wallet) — what it is, how cashback is earned, redemption in payment flows, gifting, savings (waitlist)
---

# Care Fund Journey

## What is the Care Fund?

The Care Fund is a cashback wallet that accrues Jireh rewards from healthcare payments. It is presented to users as a savings/cashback account (not a bank account). Key points:

- Earns cashback on payments made through Jireh (5% displayed as an estimate in the UI; actual rate computed server-side)
- Can be applied as a discount when paying a medical bill
- Can be gifted/transferred to other Jireh users
- Has a separate transaction history
- Displayed as a credit card-style widget (`CareFundCard`) on the dashboard and Care Fund page

The Care Fund is **not** the same as the Jireh Wallet or the Jireh Medical Loan. In the codebase, the wallet type for this balance is `"CASHBACK"` in the standard payment flow and `"CAREFUND"` in the Fast Track payment flow.

---

## Route Namespace

```
/patients/care-fund/
```

Defined in `PatientCareFundWrapper.tsx`:
```
src/Routes/Patient/Pages/PatientCareFund/
  PatientCareFundWrapper.tsx   — route definitions
  PatientCareFund.tsx          — main page (balance card + CTAs + transaction history)
  PatientCareFundSavings.tsx   — deposit UI (waitlisted feature)
  PatientCareFundSuccess.tsx   — confirmation page after gift
  PatientGiftRecipient.tsx     — gift care fund to another user
  PatientCareFundExplainer.tsx — educational UI shown when no transactions
  components/
    CareFundCard.tsx           — animated balance display card
    CareFundTransactions.tsx   — paginated transaction history
```

---

## Care Fund Routes

```
/patients/care-fund/         PatientCareFundPage (main)
/patients/care-fund/savings  PatientCareFundSavings (coming soon — waitlist only)
/patients/care-fund/gift-recipient  PatientGiftRecipient
/patients/care-fund/success  PatientCareFundSuccess
```

---

## Earning Cashback

Cashback is earned server-side when a patient completes a payment at an in-network (APPROVED) facility via Jireh. The `CareFundCard` in `PatientReviewInvoice.tsx` shows an estimate:

```typescript
const cashbackAmount = formatMoney(amountValue * 0.05 || 0, "KES")
// Displayed as: "you could earn up to KES X cashback!"
```

This is a UI estimate only. The actual cashback rate and amount are determined by the backend's payment processing logic.

In the Care Fund transaction history, earned cashback appears with `type: "EARNED"`.

---

## Care Fund Balance Data Source

The Care Fund balance is fetched as part of `usePaymentHistory`:

```typescript
// src/Routes/Patient/hooks/usePaymentHistory.ts
const { data: paymentHistory } = usePaymentHistory()
const { careFundAccount } = paymentHistory || {}
const { careFundBalance, currency } = careFundAccount || {}
```

The `careFundAccount.careFundBalance` is stored as a string (or numeric). The UI parses it with `parseFloat(String(careFundBalance))` to avoid rounding issues.

`CareFundCard` additionally uses `usePersistentBalance("careFundBalanceVisible")` — a hook that persists the show/hide balance toggle in localStorage so the user's preference survives navigation.

---

## Redeeming Care Fund in a Payment

The Care Fund wallet is available as a payment option in both the standard invoice flow and Fast Track.

### In Standard Invoice Flow (PatientWalletSelection)

The Care Fund appears as `type: "CASHBACK"` in `user.wallets`. The user can allocate part or all of their care fund balance toward the total bill. The allocation is saved as:

```typescript
allocations[cashbackWalletId] = {
  walletId: cashbackWalletId,
  amount: allocatedCashbackAmount,
  type: "CASHBACK",
}
```

This becomes a `paymentSplit` with `type: "CASHBACK"` in the final POST to `/payments/user/initiate-multi-payment`.

In the wallet selection UI the subtitle for the CASHBACK wallet reads:
```
"Cashback earned or received ."
```

In the payment confirmation display, the wallet is labelled "Cashback" in the source-of-funds list.

### In Fast Track (FastTrackWalletSelection)

The Care Fund appears as `mode: "CAREFUND"` (different enum from the loan flow) in the splits array. The split is sent to `/fast-track/initiate` as:

```typescript
{ mode: "CAREFUND", amount: number }
```

---

## Care Fund as Discount at Set Bill Amount Step

`PatientSetBillAmount` offers the option to apply the care fund as a bill discount before choosing wallets. The user can enter a `careFundDiscountAmount`. This is passed through React Router state to subsequent steps, ultimately reducing the `totalBillAmount` by that amount before the wallet allocation step.

This is different from using the Care Fund as a wallet split in `PatientWalletSelection` — the discount reduces the bill upfront.

---

## Transaction History

`CareFundTransactions` fetches from `GET /care-fund/transactions` and renders grouped-by-date rows.

```typescript
interface CareFundTransaction {
  id: string
  transactionAmount: number
  currency: { code: string }
  type: "TRANSFER" | "EARNED" | "SPENT"
  status: "PENDING" | "COMPLETED" | "FAILED" | "REVERSED"
  sender: { accountOwner: { id, firstName, lastName } } | null
  receiver: { accountOwner: { id, firstName, lastName } } | null
  receiverPhoneNumber: string | null
  description: string | null
  loan: any | null
  createdAt: string
  expiresAt: string | null
}
```

Transaction types and their display:
| `type` | Icon | Meaning |
|--------|------|---------|
| `EARNED` | `TrendingUp` | Cashback earned from a payment |
| `SPENT` | `CreditCard` | Care Fund used in a payment |
| `TRANSFER` (receiver) | `ArrowDownLeft` | Received Care Fund gift |
| `TRANSFER` (sender) | `ArrowUpRight` | Sent Care Fund gift |

When there are no transactions, `PatientCareFundExplainer` renders educational content explaining how to earn.

---

## Gifting Care Fund

`PatientGiftRecipient` allows a user to send their care fund balance to another Jireh user. The recipient is identified by phone number.

Route: `/patients/care-fund/gift-recipient`

The CTA for gifting is only shown if `user.canPayMedicalBill && careFundAccount` is truthy (checked in `PatientCareFund.tsx`).

---

## Savings Feature (Coming Soon)

`PatientCareFundSavings` shows a deposit form UI but the submit action is gated behind a `WaitlistDialog` component. The dialog collects user interest (type `"SAVINGS"`) and displays "Coming soon". The feature is not live.

---

## Cashback Banner

`CashbackBanner` (`src/components/CashbackBanner.tsx`) is a reusable component shown in the invoice review step when the facility is in-network. It shows the estimated cashback the user would earn.

Props:
```typescript
interface CashbackBannerProps {
  visible: boolean       // conditionally rendered
  title: string
  description: string    // e.g., "With a bill of KES 5000, you could earn up to KES 250 cashback!"
}
```

---

## Gotchas

1. **CASHBACK vs CAREFUND**: The wallet type is `"CASHBACK"` in the standard loan/payment flow and `"CAREFUND"` as a split mode in Fast Track. These are functionally the same balance but use different identifiers depending on the API endpoint.

2. **Raw balance vs formatted**: The Care Fund balance should always be parsed with `parseFloat(String(careFundBalance))` before display — the value comes from the API as a string or number and rounding it causes display inconsistencies. `CareFundCard` and `PatientWalletSelection` both do `parseFloat(String(careFundBalance))` explicitly.

3. **canPayMedicalBill gate**: The redeem and share CTAs on the Care Fund page are only shown if `user.canPayMedicalBill` is truthy. This is a server-set flag, not derived client-side.

4. **Savings is waitlisted**: Despite the UI form appearing live, the savings feature does not actually process deposits. The submit button opens a waitlist dialog.
