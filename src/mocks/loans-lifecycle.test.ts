// @vitest-environment jsdom
//
// End-to-end integration test for the WHOLE loan lifecycle, driven through the
// REAL mock endpoints the app calls — deliberately NOT a UI test. The money
// logic (limit funding on upgrade, limit draw-down on borrow, principal restore
// + 5% cashback on every repayment, outstanding/totalPaid math) lives in the
// mock domain + handlers, so asserting it at the HTTP-contract level is the
// fast, refactor-proof source of truth. The UI's job — reading these values and
// refetching after a repayment — is covered separately by
// PatientPaymentPortal.test.tsx (query invalidation).
//
// Walks one fresh account through: upgrade → raise limit → take a loan →
// partial repayment → partial repayment → full repayment, asserting the
// dashboard/loan/cashback numbers at every step.
import { setupServer } from "msw/node"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { handlers } from "./handlers"
import { seedFreshAccount } from "./domain/seed"

const server = setupServer(...handlers)
const ORIGIN = window.location.origin

beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }))
afterAll(() => server.close())
beforeEach(() => {
  localStorage.clear()
  seedFreshAccount()
})

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

/** Care-fund ledger entries (newest first), via the real transactions endpoint. */
const careFundTxns = async () =>
  (
    await (
      await fetch(ORIGIN + "/care-fund/transactions?page=1&limit=50")
    ).json()
  ).data as { type: string; transactionAmount: number; description: string }[]

const upgradeToPlus = () =>
  fetch(ORIGIN + "/patients/submit-plan-details", json({}))

const uploadMpesaStatement = () => {
  const form = new FormData()
  form.append(
    "financialStatementFile",
    new File(["pdf"], "statement.pdf", { type: "application/pdf" })
  )
  return fetch(ORIGIN + "/underwriting/upload-mpesa-statement", {
    method: "POST",
    body: form,
  })
}

const applyForLoan = (loanAmount: number) =>
  fetch(
    ORIGIN + "/loans/patient/apply-for-loan",
    json({
      loanAmount,
      totalBillAmount: loanAmount,
      repaymentPeriodDays: 31,
      patientName: "Amina Otieno",
      careProviderId: "fac-001",
    })
  )

const repay = (loanId: string | number, amount: number) =>
  fetch(
    ORIGIN + "/loans/patient/me/initiate-repayment",
    json({ loanId, amount })
  )

const getLoan = async (loanId: string | number) =>
  (await fetch(ORIGIN + `/loans/patient/me/${loanId}`)).json()

describe("loan lifecycle (fresh account)", () => {
  it("upgrades, borrows, and repays — balances + cashback track every step", async () => {
    // ── 0. Fresh account: no membership, no limit, no cashback ──────────────
    let s = await stats()
    expect(Number(s.remainingCreditLimit)).toBe(0)
    expect(Number(s.outstandingAmount)).toBe(0)
    expect(await cashbackBalance()).toBe(0)

    // ── 1. Upgrade to Jireh Plus → funds the default KES 500 limit ──────────
    expect((await upgradeToPlus()).status).toBeLessThan(400)
    s = await stats()
    expect(Number(s.totalCreditLimit)).toBe(500)
    expect(Number(s.remainingCreditLimit)).toBe(500)

    // ── 2. Raise the limit by uploading an M-Pesa statement → KES 6,000 ─────
    expect((await uploadMpesaStatement()).status).toBeLessThan(400)
    s = await stats()
    expect(Number(s.totalCreditLimit)).toBe(6000)
    expect(Number(s.remainingCreditLimit)).toBe(6000)

    // ── 3. Take a KES 2,000 loan → draws limit down, raises outstanding ─────
    const apply = await applyForLoan(2000)
    expect(apply.status).toBeLessThan(400)
    const loanId = (await apply.json()).loanId

    s = await stats()
    expect(Number(s.remainingCreditLimit)).toBe(4000) // 6000 - 2000
    expect(Number(s.outstandingAmount)).toBe(2000)
    // The new loan shows up in payment history; borrowing earns no cashback yet.
    const hist = await history()
    expect(hist.loans.some((l: { id: string }) => l.id === loanId)).toBe(true)
    expect(await cashbackBalance()).toBe(0)

    // ── 4. First partial repayment: KES 800 ─────────────────────────────────
    expect((await repay(loanId, 800)).status).toBeLessThan(400)
    s = await stats()
    expect(Number(s.outstandingAmount)).toBe(1200) // 2000 - 800
    expect(Number(s.remainingCreditLimit)).toBe(4800) // 4000 + 800 restored
    expect(Number(s.totalPaid)).toBe(800)
    expect(await cashbackBalance()).toBe(40) // 5% of 800

    const loanAfterPartial = await getLoan(loanId)
    expect(Number(loanAfterPartial.outstandingAmount)).toBe(1200)
    expect(loanAfterPartial.status).toBe("DISBURSED")

    // ── 5. Second partial repayment: KES 200 ────────────────────────────────
    expect((await repay(loanId, 200)).status).toBeLessThan(400)
    s = await stats()
    expect(Number(s.outstandingAmount)).toBe(1000)
    expect(Number(s.remainingCreditLimit)).toBe(5000)
    expect(await cashbackBalance()).toBe(50) // 40 + 5% of 200

    // ── 6. Full repayment of the remaining KES 1,000 ────────────────────────
    expect((await repay(loanId, 1000)).status).toBeLessThan(400)
    s = await stats()
    expect(Number(s.outstandingAmount)).toBe(0)
    expect(Number(s.remainingCreditLimit)).toBe(6000) // fully restored to total
    expect(await cashbackBalance()).toBe(100) // 50 + 5% of 1000

    const paidLoan = await getLoan(loanId)
    expect(paidLoan.status).toBe("PAID")
    expect(Number(paidLoan.outstandingAmount)).toBe(0)

    // ── 7. Cashback was earned on EVERY repayment — 3 distinct ledger entries
    const rewards = (await careFundTxns()).filter(
      (t) => t.type === "EARNED" && t.description === "Loan repayment reward"
    )
    expect(rewards.length).toBe(3)
    expect(
      rewards.map((r) => r.transactionAmount).sort((a, b) => a - b)
    ).toEqual([10, 40, 50])
  })

  it("a fully repaid loan frees the full limit for re-borrowing", async () => {
    await upgradeToPlus() // 500 limit
    const loanId = (await (await applyForLoan(500)).json()).loanId
    expect(Number((await stats()).remainingCreditLimit)).toBe(0)

    await repay(loanId, 500) // clears the loan
    expect(Number((await stats()).remainingCreditLimit)).toBe(500)

    // The freed limit can be borrowed again.
    const second = await applyForLoan(500)
    expect(second.status).toBeLessThan(400)
    expect(Number((await stats()).remainingCreditLimit)).toBe(0)
    expect(Number((await stats()).outstandingAmount)).toBe(500)
  })
})
