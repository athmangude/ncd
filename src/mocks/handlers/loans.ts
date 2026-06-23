import { http, HttpResponse } from "msw"
import {
  makeId,
  readCollection,
  readObject,
  writeCollection,
  writeObject,
} from "../db"
import { getLoginDetails } from "./profile"
import {
  addCareFundTransaction,
  adjustCareFundBalance,
  buildCareFundAccountSummary,
  earnCashback,
} from "../domain/careFund"
import loansSeed from "../fixtures/loans.json"
import paymentHistorySeed from "../fixtures/payment-history.json"
import manualRequestsSeed from "../fixtures/manual-requests.json"

export const LOANS_KEY = "loans"
export const PAYMENT_HISTORY_KEY = "payment-history"
export const MANUAL_REQUESTS_KEY = "manual-requests"
export const TRANSACTION_RESULTS_KEY = "transaction-results"

/**
 * Result payloads the `/patients/payments/transaction-result/:reference` screen
 * reads, keyed by the payment reference. A loan repayment writes a real entry
 * here so the result screen reflects the actual amount + cashback instead of a
 * hardcoded stub.
 */
export interface TransactionResult {
  id: string
  status: string
  totalBillAmount: number
  transactionAmount: number
  updatedAt: string
  transactionDateTime: string
  description: string
  isLoanRepayment: boolean
  loanId?: string
  providerName?: string
  paymentSplits: unknown[]
  careFundPotentialAmount: number | null
}

type TransactionResultsShape = Record<string, TransactionResult>

export function saveTransactionResult(
  reference: string,
  result: TransactionResult
): void {
  const all = readObject<TransactionResultsShape>(TRANSACTION_RESULTS_KEY, {})
  writeObject<TransactionResultsShape>(TRANSACTION_RESULTS_KEY, {
    ...all,
    [reference]: result,
  })
}

export function getTransactionResult(
  reference: string
): TransactionResult | null {
  const all = readObject<TransactionResultsShape>(TRANSACTION_RESULTS_KEY, {})
  return all[reference] ?? null
}

type Loan = (typeof loansSeed)[number]
type ManualRequest = (typeof manualRequestsSeed)[number]

// Persisted payment-history shape. Kept deliberately permissive so newly
// created payments (and the seed payments) share one type without fighting the
// narrow literals TypeScript infers from the fixture JSON.
interface PaymentSplitRecord {
  id: string
  createdAt: string
  paymentSplitAmount: number
  wallet: { type: string }
  loan: Record<string, unknown> | null
}

interface PaymentRecord {
  id: string
  totalBillAmount: number
  createdAt: string
  currency: { code: string }
  status: string
  patientMedicalInfoRequest: {
    facility: { id: string; name: string }
    medicalInvoiceFile: { careProviderName: string }
  }
  user: { firstName: string; lastName: string }
  disbursementTransaction: { description: string }
  paymentSplits: PaymentSplitRecord[]
  cashbackDetails: { source: string; amount: number }[]
}

interface PaymentHistoryShape {
  payments: PaymentRecord[]
  medicalRequests: unknown[]
}

interface PaymentSplitResult {
  id: string
  splitAmount: string
  walletId: string
  walletType: string
  walletBalance: string
  paymentRedirectUrl?: string
}

/** Care-provider id → display name (matches request-medical-info-form-data). */
const FACILITY_NAMES: Record<string, string> = {
  "fac-001": "Aga Khan University Hospital",
  "fac-002": "Nairobi Hospital",
  "fac-003": "Mater Misericordiae Hospital",
  "fac-006": "Kenyatta National Hospital",
  "fac-007": "MP Shah Hospital",
}

function facilityName(id?: string): string {
  return (id && FACILITY_NAMES[id]) || "Healthcare Provider"
}

/** Loans persisted to localStorage (seeded from the fixture on first read). */
function getLoans(): Loan[] {
  return readCollection<Loan>(LOANS_KEY, loansSeed)
}

/** Manual payment review requests persisted to localStorage. */
function getManualRequests(): ManualRequest[] {
  return readCollection<ManualRequest>(MANUAL_REQUESTS_KEY, manualRequestsSeed)
}

/** Rich payment history object (payments + medical requests). */
function getPaymentHistory(): PaymentHistoryShape {
  return readObject<PaymentHistoryShape>(
    PAYMENT_HISTORY_KEY,
    paymentHistorySeed as unknown as PaymentHistoryShape
  )
}

function addPayment(payment: PaymentRecord): void {
  const history = getPaymentHistory()
  writeObject<PaymentHistoryShape>(PAYMENT_HISTORY_KEY, {
    ...history,
    payments: [payment, ...(history.payments || [])],
  })
}

/** A normalized split shared by the multi-payment and Fast Track pay flows. */
export interface RecordPaymentSplit {
  type: string
  amount: number
  repaymentPeriodDays?: number
}

/**
 * Persist a bill payment and apply every side effect a "pay a bill" produces:
 * create a loan for any LOAN split, spend cashback for any CASHBACK split, earn
 * 5% cashback on the MPESA portion, and append the payment to history. Shared by
 * `/payments/user/initiate-multi-payment` and `/fast-track/initiate` so both
 * flows behave identically. Callers may supply `paymentId` so a record can be
 * looked up by an id they already minted (Fast Track passes its transaction id).
 */
export function recordPayment(params: {
  totalBillAmount: number
  facilityId?: string
  facilityName: string
  patientName: string
  splits: RecordPaymentSplit[]
  paymentId?: string
}): { payment: PaymentRecord; splitResults: PaymentSplitResult[] } {
  const profile = getLoginDetails()
  const { totalBillAmount, facilityName: name, patientName } = params
  const nowIso = new Date().toISOString()
  const paymentId = params.paymentId || makeId("pay")

  const splitResults: PaymentSplitResult[] = []

  const paymentSplits: PaymentSplitRecord[] = params.splits.map((split) => {
    const amount = Number(split.amount) || 0
    const walletType = split.type || "WALLET"
    let loanRef: Record<string, unknown> | null = null

    if (walletType === "LOAN") {
      const loan = buildLoan({
        amount,
        totalBillAmount,
        repaymentPeriodDays: split.repaymentPeriodDays,
        facilityId: params.facilityId,
        facilityName: name,
        patientName,
      })
      writeCollection(LOANS_KEY, [loan, ...getLoans()])
      loanRef = {
        id: loan.id,
        amount: loan.amount,
        totalBillAmount: loan.totalBillAmount,
        outstandingAmount: loan.outstandingAmount,
        totalPaid: loan.totalPaid,
        loanDueDate: loan.loanDueDate,
        transactions: [],
      }
    }

    if (walletType === "CASHBACK" && amount > 0) {
      adjustCareFundBalance(-amount)
      addCareFundTransaction({
        transactionAmount: amount,
        type: "SPENT",
        description: `Applied to bill at ${name}`,
        sender: {
          accountOwner: {
            id: profile.id,
            firstName: profile.firstName,
            lastName: profile.lastName,
          },
        },
      })
    }

    splitResults.push({
      id: makeId("split-result"),
      splitAmount: String(amount),
      walletId: makeId("wallet"),
      walletType,
      walletBalance: "0",
    })

    return {
      id: makeId("split"),
      createdAt: nowIso,
      paymentSplitAmount: amount,
      wallet: { type: walletType },
      loan: loanRef,
    }
  })

  // Earn 5% cashback on the amount paid from MPESA (matches the in-app copy).
  const mpesaTotal = params.splits
    .filter((split) => split.type === "MPESA")
    .reduce((sum, split) => sum + (Number(split.amount) || 0), 0)
  const cashbackEarned = Math.round(mpesaTotal * 0.05)
  if (cashbackEarned > 0) {
    earnCashback(cashbackEarned, `Cashback from ${name}`)
  }

  const payment: PaymentRecord = {
    id: paymentId,
    totalBillAmount,
    createdAt: nowIso,
    currency: { code: "KES" },
    status: "COMPLETED",
    patientMedicalInfoRequest: {
      facility: { id: params.facilityId || "fac-unknown", name },
      medicalInvoiceFile: { careProviderName: name },
    },
    user: { firstName: profile.firstName, lastName: profile.lastName },
    disbursementTransaction: { description: `Payment to ${name}` },
    paymentSplits,
    cashbackDetails:
      cashbackEarned > 0
        ? [{ source: `Paid with Jireh at ${name}`, amount: cashbackEarned }]
        : [],
  }

  addPayment(payment)

  return { payment, splitResults }
}

/** Build a fully-disbursed loan record shared by the apply + pay flows. */
function buildLoan(params: {
  amount: number
  totalBillAmount: number
  repaymentPeriodDays?: number
  careFundDiscountAmount?: number
  facilityId?: string
  facilityName: string
  patientName: string
}): Loan {
  const now = new Date()
  const repaymentDays = Number(params.repaymentPeriodDays) || 31
  const dueDate = new Date(now.getTime() + repaymentDays * 24 * 60 * 60 * 1000)

  const loan: Loan = {
    id: makeId("loan"),
    amount: params.amount,
    totalBillAmount: params.totalBillAmount,
    outstandingAmount: params.amount,
    totalPaid: 0,
    careFundDiscountAmount: Number(params.careFundDiscountAmount) || 0,
    accumulatedInterestAmount: 0,
    lateFees: 0,
    status: "DISBURSED",
    loanType: "MEMBERSHIP",
    currency: { code: "KES" },
    createdAt: now.toISOString(),
    loanDueDate: dueDate.toISOString(),
    firstPaymentDue: dueDate.toISOString(),
    patientName: params.patientName,
    patientMedicalInfoRequest: {
      patientName: params.patientName,
      facility: {
        id: params.facilityId || "fac-unknown",
        name: params.facilityName,
      },
    },
    transactions: [],
  }

  return loan
}

/**
 * A tiny but valid one-page PDF used as the receipt download payload. Avoids
 * pulling in any binary asset while still saving as a real .pdf the browser
 * can open.
 */
const PLACEHOLDER_PDF = `%PDF-1.1
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
trailer<</Root 1 0 R>>
%%EOF`

export const loansHandlers = [
  // --- Loan stats ----------------------------------------------------------
  http.get("/loans/patient/me/stats", () => {
    const loans = getLoans()
    const outstandingAmount = loans.reduce(
      (sum, loan) => sum + Number(loan.outstandingAmount || 0),
      0
    )
    const totalLoanAmount = loans.reduce(
      (sum, loan) => sum + Number(loan.amount || 0),
      0
    )
    // Repaid-to-date across all loans (borrowed minus what's still owed).
    const totalPaid = loans.reduce(
      (sum, loan) =>
        sum +
        Math.max(
          0,
          Number(loan.amount || 0) - Number(loan.outstandingAmount || 0)
        ),
      0
    )

    // "Available to borrow" + total limit drive the dashboard loan/balance
    // cards. They come from the profile credit limit, which the Jireh Plus
    // upgrade funds (KES 500 default) — without these the unlocked card would
    // read "Available to Borrow: KES 0".
    const creditLimit = getLoginDetails().creditLimit
    const remainingCreditLimit = Number(creditLimit?.remainingAmount ?? 0)
    const totalCreditLimit = Number(creditLimit?.totalCreditLimitAmount ?? 0)
    const currency = creditLimit?.currency?.code || "KES"

    return HttpResponse.json({
      outstandingAmount,
      totalLoanAmount,
      totalPaid,
      remainingCreditLimit,
      totalCreditLimit,
      currency,
      totalLoans: loans.length,
    })
  }),

  // --- Loan detail ---------------------------------------------------------
  http.get("/loans/patient/me/:id", ({ params }) => {
    const loans = getLoans()
    const loan = loans.find((item) => String(item.id) === String(params.id))

    if (!loan) {
      return HttpResponse.json({ message: "Loan not found" }, { status: 404 })
    }

    return HttpResponse.json(loan)
  }),

  // --- Apply for a loan ----------------------------------------------------
  http.post("/loans/patient/apply-for-loan", async ({ request }) => {
    const body = (await request.json()) as {
      careProviderId?: string
      careProviderName?: string
      totalBillAmount?: number
      loanAmount?: number
      repaymentPeriodDays?: number
      patientId?: string
      patientName?: string
      careFundDiscountAmount?: number
      fileId?: string
    }

    const loans = getLoans()
    const newLoan = buildLoan({
      amount: Number(body.loanAmount) || 0,
      totalBillAmount: Number(body.totalBillAmount) || 0,
      repaymentPeriodDays: body.repaymentPeriodDays,
      careFundDiscountAmount: body.careFundDiscountAmount,
      facilityId: body.careProviderId,
      facilityName:
        body.careProviderName ||
        facilityName(body.careProviderId) ||
        "Healthcare Provider",
      patientName: body.patientName || "Patient",
    })

    writeCollection(LOANS_KEY, [newLoan, ...loans])

    // The consumer (PatientLoanTerms) reads `data.loanId` and only redirects
    // when `data.authorizationUrl` is truthy. Omitting authorizationUrl keeps
    // the flow in-app. `id` is included to satisfy the documented shape too.
    return HttpResponse.json({
      id: newLoan.id,
      loanId: newLoan.id,
      message: "Loan application successful",
    })
  }),

  // --- Initiate a loan repayment ------------------------------------------
  // PatientPaymentPortal navigates to an internal transaction-result route
  // when `isChargeTransaction` is true, otherwise it calls
  // window.location.assign(authorizationUrl). We return isChargeTransaction:
  // true so the flow stays in-app (no external gateway redirect).
  http.post("/loans/patient/me/initiate-repayment", async ({ request }) => {
    const body = (await request.json()) as {
      amount?: number
      loanId?: number | string
      isTransactionFeePayment?: boolean
    }

    const loans = getLoans()
    const amount = Number(body.amount) || 0
    const repaidLoan = loans.find(
      (loan) => String(loan.id) === String(body.loanId)
    )
    const providerName =
      repaidLoan?.patientMedicalInfoRequest?.facility?.name ||
      "Healthcare Provider"

    const updated = loans.map((loan) => {
      if (String(loan.id) !== String(body.loanId)) {
        return loan
      }

      const newOutstanding = Math.max(
        0,
        Number(loan.outstandingAmount || 0) - amount
      )

      return {
        ...loan,
        outstandingAmount: newOutstanding,
        totalPaid: Number(loan.totalPaid || 0) + amount,
        status: newOutstanding === 0 ? "PAID" : loan.status,
        transactions: [
          ...(loan.transactions || []),
          {
            id: makeId("txn"),
            amount,
            description: body.isTransactionFeePayment
              ? "Transaction fee payment"
              : "Loan repayment",
            transactionType: "COLLECTION",
            date: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ],
      }
    })

    writeCollection(LOANS_KEY, updated)

    // Reward repayments with 5% cashback (mirrors the in-app "earn when you
    // repay before the due date" messaging).
    const isLoanRepayment = amount > 0 && !body.isTransactionFeePayment
    if (isLoanRepayment) {
      earnCashback(Math.round(amount * 0.05), "Loan repayment reward")
    }

    // Persist a real result so the transaction-result screen reflects the
    // actual repayment instead of a hardcoded stub.
    const reference = makeId("ref")
    const nowIso = new Date().toISOString()
    saveTransactionResult(reference, {
      id: reference,
      status: "COMPLETED",
      totalBillAmount: amount,
      transactionAmount: amount,
      updatedAt: nowIso,
      transactionDateTime: nowIso,
      description: body.isTransactionFeePayment
        ? "transaction fee payment"
        : "loan repayment",
      isLoanRepayment,
      loanId: body.loanId != null ? String(body.loanId) : undefined,
      providerName,
      paymentSplits: [],
      careFundPotentialAmount: null,
    })

    return HttpResponse.json({
      isChargeTransaction: true,
      authorizationUrl: "",
      reference,
    })
  }),

  // --- Multi-wallet payment (the main "pay a bill" flow) ------------------
  // PatientPaymentConfirmation posts here, then navigates to
  // /patients/payment-status?paymentId=. We persist a payment so it shows in
  // history, create a loan for any LOAN split, spend cashback for any CASHBACK
  // split, and earn 5% cashback on the MPESA portion (partner-hospital reward).
  http.post("/payments/user/initiate-multi-payment", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      totalBillAmount?: number
      medicalInvoiceFileId?: string
      paymentSplits?: {
        walletId?: string
        paymentAmount?: number
        type?: string
        discountCode?: string
      }[]
      kmpdcFacilityId?: string
      patientName?: string
      repaymentPeriodDays?: number
      manualPaymentRequestId?: string
    }

    const profile = getLoginDetails()
    const splits = body.paymentSplits || []
    const totalBillAmount = Number(body.totalBillAmount) || 0
    const name = facilityName(body.kmpdcFacilityId)
    const patientName =
      body.patientName || `${profile.firstName} ${profile.lastName}`

    const { payment, splitResults } = recordPayment({
      totalBillAmount,
      facilityId: body.kmpdcFacilityId,
      facilityName: name,
      patientName,
      splits: splits.map((split) => ({
        type: split.type || "WALLET",
        amount: Number(split.paymentAmount) || 0,
        repaymentPeriodDays: body.repaymentPeriodDays,
      })),
    })

    return HttpResponse.json({
      message: "Payment successful",
      paymentId: payment.id,
      totalBillAmount: String(totalBillAmount),
      status: "COMPLETED",
      paymentSplitResults: splitResults,
    })
  }),

  // --- Payment history (dashboard + history pages) ------------------------
  http.get("/patients/payment-history", () => {
    const history = getPaymentHistory()
    const loans = getLoans()

    // Merge persisted loans into the history `loans` list so newly applied
    // loans show up on the dashboard and history without a separate fixture.
    // careFundAccount is derived from the profile balance (single source of
    // truth) so it never drifts from the Care Fund card / savings screens.
    return HttpResponse.json({
      loans,
      payments: history.payments || [],
      medicalRequests: history.medicalRequests || [],
      careFundAccount: buildCareFundAccountSummary(),
    })
  }),

  // --- Manual payment requests --------------------------------------------
  http.get("/patients/payments/manual-requests", () => {
    return HttpResponse.json({ requests: getManualRequests() })
  }),

  http.delete("/patients/payments/manual-requests/:requestId", ({ params }) => {
    const requests = getManualRequests()
    const remaining = requests.filter(
      (item) => String(item.id) !== String(params.requestId)
    )
    writeCollection(MANUAL_REQUESTS_KEY, remaining)

    return HttpResponse.json({ message: "Payment request deleted" })
  }),

  // --- Create a manual review request -------------------------------------
  http.post("/payments/manual-review-request", async ({ request }) => {
    const body = (await request.json()) as {
      kmpdcFacilityId?: string
      careProviderName?: string
      billAmount?: number
      invoiceFileId?: string
      dependentId?: string
      paymentInfo?: {
        type?: string
        tillNumber?: string
        businessNumber?: string
        accountNumber?: string
        paybillAccountNumber?: string
      } | null
    }

    const requests = getManualRequests()
    const id = makeId("mrr")
    const now = new Date().toISOString()

    const newRequest: ManualRequest = {
      id,
      careProviderName: body.careProviderName || "Healthcare Provider",
      billAmount: String(body.billAmount ?? "0"),
      paymentInfo: {
        type: body.paymentInfo?.type || "MPTILL",
        tillNumber: body.paymentInfo?.tillNumber || "",
        paybillNumber: body.paymentInfo?.businessNumber || "",
        accountNumber:
          body.paymentInfo?.accountNumber ||
          body.paymentInfo?.paybillAccountNumber ||
          "",
      },
      reason: null,
      status: "PENDING",
      createdAt: now,
      updatedAt: now,
      patient: {
        id: "patient-001",
        firstName: "Wanjiru",
        lastName: "Kamau",
        phoneNumber: "+254712345678",
        email: "wanjiru.kamau@example.com",
      },
      dependent: null,
      kmpdcFacility: {
        id: body.kmpdcFacilityId || "fac-unknown",
        name: body.careProviderName || "Healthcare Provider",
      },
      invoiceFile: {
        id: body.invoiceFileId || makeId("file"),
        filePath: `/uploads/${id}.pdf`,
        originalFileName: "invoice.pdf",
        url: `/uploads/${id}.pdf`,
      },
    }

    writeCollection(MANUAL_REQUESTS_KEY, [newRequest, ...requests])

    return HttpResponse.json({ id, message: "Payment request submitted" })
  }),

  http.get("/payments/manual-review-request/:id", ({ params }) => {
    const requests = getManualRequests()
    const found = requests.find((item) => String(item.id) === String(params.id))

    if (!found) {
      return HttpResponse.json(
        { message: "Request not found" },
        { status: 404 }
      )
    }

    return HttpResponse.json(found)
  }),

  // --- Medical invoice upload ---------------------------------------------
  http.post("/patients/upload-medical-invoice", async () => {
    // Field is multipart `file`; we don't inspect it, just hand back a fake id.
    return HttpResponse.json({
      invoiceFile: { id: makeId("file") },
    })
  }),

  // --- Care provider options for the request-loan form --------------------
  http.get("/patients/request-medical-info-form-data", () => {
    return HttpResponse.json({
      careProviders: [
        { name: "Aga Khan University Hospital", value: "fac-001" },
        { name: "Nairobi Hospital", value: "fac-002" },
        { name: "Mater Misericordiae Hospital", value: "fac-003" },
        { name: "Kenyatta National Hospital", value: "fac-006" },
        { name: "MP Shah Hospital", value: "fac-007" },
      ],
    })
  }),

  // --- Initiate a payment (payment-methods flow) --------------------------
  // Same in-app strategy as initiate-repayment: isChargeTransaction true.
  http.post("/patients/payments/initiate-payment", async () => {
    return HttpResponse.json({
      isChargeTransaction: true,
      authorizationUrl: "",
      reference: makeId("ref"),
    })
  }),

  // --- Saved payment methods ----------------------------------------------
  http.get("/patients/payments/payment-methods", () => {
    return HttpResponse.json({
      hasSetUpPaymentMethods: false,
      creditCards: [],
      debitCards: [],
      mobileMoneyAccounts: [],
    })
  }),

  // --- Payment details (view payment) -------------------------------------
  http.get("/payments/user/payment-details", ({ request }) => {
    const paymentId = new URL(request.url).searchParams.get("paymentId")
    const history = getPaymentHistory()
    const payment = (history.payments || []).find(
      (item) => String(item.id) === String(paymentId)
    )

    if (!payment) {
      return HttpResponse.json(
        { message: "Payment not found" },
        { status: 404 }
      )
    }

    return HttpResponse.json(payment)
  }),

  // --- Transaction receipt (PDF blob) -------------------------------------
  http.get("/transactions/:transactionId/receipt", () => {
    return new HttpResponse(new Blob([PLACEHOLDER_PDF]), {
      headers: { "Content-Type": "application/pdf" },
    })
  }),
]
