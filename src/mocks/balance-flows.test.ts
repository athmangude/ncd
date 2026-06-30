// @vitest-environment jsdom
//
// End-to-end guards for the three dashboard balances (Payments / Loans /
// Cashback cards) driven through the REAL mock endpoints the cards consume:
//   - Cashback         → GET /patients/payment-history .careFundAccount.careFundBalance
//   - Available balance → GET /loans/patient/me/stats   .remainingCreditLimit
//   - Outstanding loan  → GET /loans/patient/me/stats   .outstandingAmount
//
// These assert the API contract, so they keep holding even if the internal
// helpers are refactored — the point is that the numbers the UI reads stay
// correct as money is earned, spent, borrowed and repaid.
import { setupServer } from "msw/node"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { handlers } from "./handlers"
import { seedFreshAccount } from "./domain/seed"

const server = setupServer(...handlers)
const ORIGIN = window.location.origin

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterAll(() => server.close())
beforeEach(() => localStorage.clear())

const json = (body: unknown) => ({
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
})

const stats = async () =>
  (await fetch(ORIGIN + "/loans/patient/me/stats")).json()

const history = async () =>
  (await fetch(ORIGIN + "/patients/payment-history")).json()

const cashbackBalance = async () =>
  Number((await history()).careFundAccount.careFundBalance)

/** Pay a bill through the multi-wallet endpoint (the main "pay a bill" flow). */
const payBill = (
  splits: { type: string; amount: number }[],
  totalBillAmount: number
) =>
  fetch(
    ORIGIN + "/payments/user/initiate-multi-payment",
    json({
      totalBillAmount,
      kmpdcFacilityId: "fac-001",
      repaymentPeriodDays: 31,
      paymentSplits: splits.map((s) => ({
        type: s.type,
        paymentAmount: s.amount,
      })),
    })
  )

describe("cashback balance lifecycle", () => {
  it("rises with MPESA earnings, falls when spent on a bill and when gifted", async () => {
    // Demo Amina starts with KES 1,850 cashback.
    expect(await cashbackBalance()).toBe(1850)

    // Earn 5% on the MPESA portion of a 1,000 bill → +50.
    await payBill([{ type: "MPESA", amount: 1000 }], 1000)
    expect(await cashbackBalance()).toBe(1900)

    // Spend 400 cashback on a bill → -400.
    await payBill([{ type: "CASHBACK", amount: 400 }], 400)
    expect(await cashbackBalance()).toBe(1500)

    // Gift 200 to a circle member → -200.
    await fetch(
      ORIGIN + "/care-fund/transfer",
      json({ patientId: "patient-002", transferAmount: 200 })
    )
    expect(await cashbackBalance()).toBe(1300)
  })

  it("earns 5% cashback when a loan is repaid", async () => {
    const before = await cashbackBalance()

    await payBill([{ type: "LOAN", amount: 2000 }], 2000)
    const { loans } = await history()
    await fetch(
      ORIGIN + "/loans/patient/me/initiate-repayment",
      json({ loanId: loans[0].id, amount: 1000 })
    )

    // +5% of the 1,000 repaid (the borrow itself earns no cashback).
    expect(await cashbackBalance()).toBe(before + 50)
  })
})

describe("available-to-borrow lifecycle", () => {
  it("tracks upgrade, M-Pesa upload, borrowing and repayment", async () => {
    seedFreshAccount()

    // Fresh account has no limit yet.
    expect(Number((await stats()).remainingCreditLimit)).toBe(0)

    // Upgrading to Jireh Plus funds the default KES 500 interest-free limit.
    await fetch(ORIGIN + "/patients/submit-plan-details", json({}))
    expect(Number((await stats()).remainingCreditLimit)).toBe(500)

    // Uploading an M-Pesa statement raises the limit to KES 6,000.
    const form = new FormData()
    form.append(
      "financialStatementFile",
      new File(["pdf"], "statement.pdf", { type: "application/pdf" })
    )
    await fetch(ORIGIN + "/underwriting/upload-mpesa-statement", {
      method: "POST",
      body: form,
    })
    let s = await stats()
    expect(Number(s.totalCreditLimit)).toBe(6000)
    expect(Number(s.remainingCreditLimit)).toBe(6000)

    // Borrowing 2,000 to pay a bill draws available down and raises outstanding.
    await payBill([{ type: "LOAN", amount: 2000 }], 2000)
    s = await stats()
    expect(Number(s.remainingCreditLimit)).toBe(4000)
    expect(Number(s.outstandingAmount)).toBe(2000)

    // Repaying the loan in full restores available and clears outstanding.
    const { loans } = await history()
    await fetch(
      ORIGIN + "/loans/patient/me/initiate-repayment",
      json({ loanId: loans[0].id, amount: 2000 })
    )
    s = await stats()
    expect(Number(s.remainingCreditLimit)).toBe(6000)
    expect(Number(s.outstandingAmount)).toBe(0)
  })

  it("a partial repayment restores only the principal paid", async () => {
    seedFreshAccount()
    await fetch(ORIGIN + "/patients/submit-plan-details", json({})) // 500
    await payBill([{ type: "LOAN", amount: 500 }], 500) // remaining 0, outstanding 500

    expect(Number((await stats()).remainingCreditLimit)).toBe(0)

    const { loans } = await history()
    await fetch(
      ORIGIN + "/loans/patient/me/initiate-repayment",
      json({ loanId: loans[0].id, amount: 200 })
    )

    const s = await stats()
    expect(Number(s.remainingCreditLimit)).toBe(200)
    expect(Number(s.outstandingAmount)).toBe(300)
  })
})

describe("over-limit borrowing guard", () => {
  it("rejects a bill paid with a loan larger than Available to Borrow", async () => {
    // Demo Amina: 3,200 available, 12,000 outstanding.
    const res = await payBill([{ type: "LOAN", amount: 5000 }], 5000)
    expect(res.status).toBe(400)

    // Nothing was disbursed: balances are untouched.
    const s = await stats()
    expect(Number(s.remainingCreditLimit)).toBe(3200)
    expect(Number(s.outstandingAmount)).toBe(12000)
  })

  it("rejects a direct loan application above the limit", async () => {
    const res = await fetch(
      ORIGIN + "/loans/patient/apply-for-loan",
      json({ loanAmount: 5000, totalBillAmount: 5000, patientName: "Amina" })
    )
    expect(res.status).toBe(400)
    expect(Number((await stats()).outstandingAmount)).toBe(12000)
  })

  it("rejects an over-limit Fast Track loan split", async () => {
    const res = await fetch(
      ORIGIN + "/fast-track/initiate",
      json({
        paymentNumber: "123456",
        amount: 9999,
        invoiceNumber: "INV-OVER",
        patientId: "self",
        discountAmount: 0,
        splits: [{ mode: "LOAN", amount: 9999 }],
      })
    )
    expect(res.status).toBe(400)
  })

  it("allows borrowing exactly up to the limit", async () => {
    const res = await payBill([{ type: "LOAN", amount: 3200 }], 3200)
    expect(res.status).toBeLessThan(400)
    expect(Number((await stats()).remainingCreditLimit)).toBe(0)
  })
})

describe("split bill: only the loan portion becomes repayable debt", () => {
  it("a 10k bill paid 9,500 MPESA + 500 LOAN leaves only 500 to repay", async () => {
    seedFreshAccount()
    await fetch(ORIGIN + "/patients/submit-plan-details", json({})) // 500 limit

    // Pay a 10,000 bill: 9,500 settled instantly via M-Pesa, 500 on credit.
    const res = await payBill(
      [
        { type: "MPESA", amount: 9500 },
        { type: "LOAN", amount: 500 },
      ],
      10000
    )
    expect(res.status).toBeLessThan(400)

    // The new loan's outstanding is the LOAN split (500), NOT the bill total.
    // totalBillAmount is kept only as context for the receipt.
    const { loans } = await history()
    const loan = loans[0]
    expect(Number(loan.outstandingAmount)).toBe(500)
    expect(Number(loan.amount)).toBe(500)
    expect(Number(loan.totalBillAmount)).toBe(10000)

    // The repayment portal is fed the loan's outstanding (500), so the user is
    // asked to repay 500 — the 9,500 already settled via M-Pesa is not owed.
    const loanDetail = await (
      await fetch(ORIGIN + `/loans/patient/me/${loan.id}`)
    ).json()
    expect(Number(loanDetail.outstandingAmount)).toBe(500)

    // Stats agree: only 500 is outstanding, and the limit drew down by 500.
    const s = await stats()
    expect(Number(s.outstandingAmount)).toBe(500)
    expect(Number(s.remainingCreditLimit)).toBe(0) // 500 limit fully drawn

    // Repaying the 500 clears the debt entirely.
    await fetch(
      ORIGIN + "/loans/patient/me/initiate-repayment",
      json({ loanId: loan.id, amount: 500 })
    )
    const after = await stats()
    expect(Number(after.outstandingAmount)).toBe(0)
    expect(Number(after.remainingCreditLimit)).toBe(500)
  })
})

describe("payments card figures", () => {
  it("available balance and outstanding loan move together when borrowing", async () => {
    // Demo Amina: 3,200 available (profile limit), 12,000 outstanding (loans.json).
    let s = await stats()
    expect(Number(s.remainingCreditLimit)).toBe(3200)
    expect(Number(s.outstandingAmount)).toBe(12000)

    await payBill([{ type: "LOAN", amount: 1000 }], 1000)

    s = await stats()
    expect(Number(s.remainingCreditLimit)).toBe(2200) // 3200 - 1000 borrowed
    expect(Number(s.outstandingAmount)).toBe(13000) // 12000 + 1000 borrowed
  })
})
