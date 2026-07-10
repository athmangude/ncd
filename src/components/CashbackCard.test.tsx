import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { CashbackCard, type CashbackTransaction } from "./CashbackCard"

// The card reads the current user from the auth store to decide sender vs
// receiver framing on transfers. Fix the user id at "me".
vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (sel: (s: { user: { id: string } }) => unknown) =>
    sel({ user: { id: "me" } }),
}))

const base: Omit<CashbackTransaction, "type"> = {
  id: "t1",
  transactionAmount: 500,
  currency: { code: "KES" },
  createdAt: "2026-06-10T09:30:00Z",
}

function renderCard(t: CashbackTransaction) {
  return render(<CashbackCard transaction={t} />)
}

describe("CashbackCard", () => {
  it("labels EARNED as 'Cashback earned'", () => {
    renderCard({ ...base, type: "EARNED" })
    expect(screen.getByText("Cashback earned")).toBeInTheDocument()
  })

  it("labels a SPENT transaction with its lowercased description", () => {
    renderCard({
      ...base,
      type: "SPENT",
      description: "Applied To Medical Bill",
    })
    expect(screen.getByText("applied to medical bill")).toBeInTheDocument()
  })

  it("frames an incoming transfer as 'Received from <sender>'", () => {
    renderCard({
      ...base,
      type: "TRANSFER",
      sender: { accountOwner: { id: "other", firstName: "Wanjiru" } },
      receiver: { accountOwner: { id: "me" } },
    })
    expect(screen.getByText("Received from Wanjiru")).toBeInTheDocument()
  })

  it("frames an outgoing transfer as 'Sent to <receiver>'", () => {
    renderCard({
      ...base,
      type: "TRANSFER",
      sender: { accountOwner: { id: "me" } },
      receiver: { accountOwner: { id: "other", firstName: "Brian" } },
    })
    expect(screen.getByText("Sent to Brian")).toBeInTheDocument()
  })

  it("renders the formatted amount and time", () => {
    renderCard({ ...base, type: "EARNED" })
    expect(screen.getByText(/KES/)).toBeInTheDocument()
  })
})
