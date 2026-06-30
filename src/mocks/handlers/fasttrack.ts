import { http, HttpResponse } from "msw"
import { readObject, writeObject, makeId } from "../db"
import { loanSplitTotal, recordPayment, rejectIfOverCreditLimit } from "./loans"
import { getLoginDetails } from "./profile"
import type {
  FastTrackPaymentPoint,
  FastTrackTransaction,
  InitiateFastTrackPaymentDto,
  VerifyInvoiceResponse,
} from "@/Routes/Patient/Pages/FastTrack/types"
import providerSeed from "../fixtures/fast-track-provider.json"

const TRANSACTIONS_KEY = "fast-track-transactions"

/** The seeded payment point, mutated to echo back the requested payment number. */
const baseProvider = providerSeed as FastTrackPaymentPoint

export const fastTrackHandlers = [
  // Resolve a provider/payment point from a 6-digit payment number.
  http.get("/fast-track/resolve-provider/:paymentNumber", ({ params }) => {
    const paymentNumber = String(params.paymentNumber)
    const provider: FastTrackPaymentPoint = {
      ...baseProvider,
      paymentNumber,
      paymentCode: `JH-${paymentNumber}`,
    }
    return HttpResponse.json(provider)
  }),

  // Verify an invoice number against a facility. In the prototype every invoice
  // is treated as new (never already submitted) so the flow can proceed.
  http.get("/fast-track/verify-invoice", () => {
    const response: VerifyInvoiceResponse = {
      exists: false,
      facilityName: baseProvider.facility.name,
    }
    return HttpResponse.json(response)
  }),

  // Initiate a Fast-Track payment. Persists the transaction and returns it with
  // an EMPTY redirect URL so the app stays in-app (no external Paystack jump).
  http.post("/fast-track/initiate", async ({ request }) => {
    const dto = (await request.json()) as InitiateFastTrackPaymentDto

    // Reject over-limit borrowing before persisting anything (parity with the
    // multi-wallet flow, and the authoritative guard if a client bypasses the UI cap).
    const overLimit = rejectIfOverCreditLimit(
      loanSplitTotal(
        dto.splits.map((s) => ({ type: s.mode, amount: s.amount }))
      )
    )
    if (overLimit) return overLimit

    const now = new Date().toISOString()
    const grossAmount = dto.amount
    const discountAmount = dto.discountAmount ?? 0
    const netAmount = grossAmount - discountAmount

    const transaction: FastTrackTransaction = {
      id: makeId("ft-txn"),
      providerId: baseProvider.id,
      patientId: dto.patientId,
      invoiceNumber: dto.invoiceNumber,
      paymentNumber: dto.paymentNumber,
      totalBillAmount: grossAmount.toFixed(2),
      grossAmount: grossAmount.toFixed(2),
      providerName: baseProvider.facility.name,
      discountAmount: discountAmount.toFixed(2),
      netAmount: netAmount.toFixed(2),
      paymentModeTags: dto.splits.map((s) => s.mode),
      status: "HOLDING",
      createdAt: now,
      updatedAt: now,
      provider: {
        id: baseProvider.facility.id,
        name: baseProvider.facility.name,
        address: baseProvider.facility.address,
        POBox: baseProvider.facility.POBox,
      },
      patient: {
        id: dto.patientId,
        firstName: "Amina",
        lastName: "Otieno",
        phoneNumber: "+254712345678",
      },
      // Empty redirect: prototype proceeds to the in-app status screen instead
      // of navigating to an external payment provider.
      paymentRedirectUrl: "",
      paymentSplitResults: dto.splits.map((s) => ({
        id: makeId("ft-split"),
        splitAmount: s.amount.toFixed(2),
        mode: s.mode,
        paymentRedirectUrl: "",
      })),
      transactionId: makeId("JHTX").toUpperCase(),
    }

    const existing = readObject<FastTrackTransaction[]>(TRANSACTIONS_KEY, [])
    writeObject(TRANSACTIONS_KEY, [transaction, ...existing])

    // Record the payment in history with full parity to the multi-wallet flow:
    // create a loan for any LOAN split, spend/earn cashback, and append a
    // PaymentRecord whose id matches this transaction so the receipt resolves.
    const profile = getLoginDetails()
    recordPayment({
      totalBillAmount: grossAmount,
      facilityId: String(baseProvider.facility.id),
      facilityName: baseProvider.facility.name,
      patientName: `${profile.firstName} ${profile.lastName}`.trim(),
      paymentId: transaction.id,
      splits: dto.splits.map((s) => ({
        type: s.mode,
        amount: s.amount,
        repaymentPeriodDays: s.repaymentPeriodDays,
      })),
    })

    return HttpResponse.json(transaction)
  }),
]
