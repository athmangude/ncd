// @vitest-environment jsdom
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

describe("borrowing limit", () => {
  it("uploading an M-Pesa statement raises the credit limit to 6000", async () => {
    const form = new FormData()
    form.append(
      "financialStatementFile",
      new File(["pdf"], "statement.pdf", { type: "application/pdf" })
    )

    const res = await fetch(ORIGIN + "/underwriting/upload-mpesa-statement", {
      method: "POST",
      body: form,
    })
    expect(res.status).toBeLessThan(400)

    const details = await (
      await fetch(ORIGIN + "/patients/credit-limit")
    ).json()
    expect(Number(details.creditLimit.totalCreditLimitAmount)).toBe(6000)
  })
})

describe("circle ↔ payment patient picker", () => {
  it("a sent invite appears in the connections list", async () => {
    await fetch(
      ORIGIN + "/patient-network/send-invite",
      json({
        firstName: "New",
        lastName: "Payee",
        phoneNumber: "+254700000000",
        relationship: "FRIEND",
      })
    )

    const conns = await (
      await fetch(ORIGIN + "/patient-network/connections")
    ).json()
    expect(
      conns.patients.some((p: { name: string }) => p.name === "New Payee")
    ).toBe(true)
  })

  const getSlots = async () =>
    (await (await fetch(ORIGIN + "/patient-network/network")).json()).slots

  it("send-invite then accept-invite moves a reserved slot to used, across the whole service", async () => {
    const before = await getSlots()

    const sent = await (
      await fetch(
        ORIGIN + "/patient-network/send-invite",
        json({
          firstName: "Asha",
          lastName: "M. Said",
          phoneNumber: "+254700111000",
          relationship: "FRIEND",
        })
      )
    ).json()

    // Reserving happens the moment the invite is sent.
    const afterSend = await getSlots()
    expect(afterSend.accountable.reserved).toBe(before.accountable.reserved + 1)

    // The participant accepting their own invite (not the facilitator, not the
    // KYC auto-accept timer) converts the reserved slot into a used one.
    await fetch(
      ORIGIN + "/patient-network/accept-invite",
      json({ inviteId: sent.inviteId, status: "ACCEPTED", type: "REFERRAL" })
    )

    const afterAccept = await getSlots()
    expect(afterAccept.accountable.used).toBe(before.accountable.used + 1)
    expect(afterAccept.accountable.reserved).toBe(before.accountable.reserved)
  })

  it("removing a connection frees its used slot consistently via the handler", async () => {
    const before = await getSlots()

    await fetch(
      ORIGIN + "/patient-network/remove-connection",
      json({ connectionId: "member-001", type: "NETWORK" })
    )

    const after = await getSlots()
    expect(after.accountable.used).toBe(before.accountable.used - 1)
  })

  it("cancelling a sent invite frees its reserved slot consistently via the handler", async () => {
    const before = await getSlots()

    await fetch(
      ORIGIN + "/patient-network/remove-invite",
      json({ inviteId: "invite-001" })
    )

    const after = await getSlots()
    expect(after.accountable.reserved).toBe(before.accountable.reserved - 1)
  })
})

describe("dashboard loan stats", () => {
  it("surfaces the profile credit limit as available-to-borrow", async () => {
    // Demo seed (Amina): 5000 total / 3200 remaining.
    const stats = await (await fetch(ORIGIN + "/loans/patient/me/stats")).json()
    expect(Number(stats.totalCreditLimit)).toBe(5000)
    expect(Number(stats.remainingCreditLimit)).toBe(3200)
  })

  it("reflects the KES 500 limit a fresh account gets after upgrading to Jireh Plus", async () => {
    seedFreshAccount()

    // Fresh account has no limit yet — the loan card would read KES 0.
    const before = await (
      await fetch(ORIGIN + "/loans/patient/me/stats")
    ).json()
    expect(Number(before.remainingCreditLimit)).toBe(0)

    // Paying for Jireh Plus funds the default interest-free limit.
    await fetch(ORIGIN + "/patients/submit-plan-details", json({}))

    const after = await (await fetch(ORIGIN + "/loans/patient/me/stats")).json()
    expect(Number(after.totalCreditLimit)).toBe(500)
    expect(Number(after.remainingCreditLimit)).toBe(500)
  })
})

describe("fast-track payment history", () => {
  it("records the payment in history with a resolvable receipt", async () => {
    const txn = await (
      await fetch(
        ORIGIN + "/fast-track/initiate",
        json({
          paymentNumber: "123456",
          amount: 1000,
          invoiceNumber: "INV-1",
          patientId: "self",
          splits: [{ mode: "MPESA", amount: 1000 }],
          discountAmount: 0,
        })
      )
    ).json()

    const history = await (
      await fetch(ORIGIN + "/patients/payment-history")
    ).json()
    expect(history.payments.some((p: { id: string }) => p.id === txn.id)).toBe(
      true
    )

    const receipt = await fetch(
      ORIGIN + "/payments/user/payment-details?paymentId=" + txn.id
    )
    expect(receipt.status).toBeLessThan(400)
  })
})
