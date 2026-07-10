import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { LoanEntry, resolveCashbackLabel } from "./HistoryCard"

const noop = () => {}

function renderLoan(outstandingAmount: number) {
  return render(
    <LoanEntry
      outstandingAmount={outstandingAmount}
      amount={9500}
      currency="KES"
      dueDate="2026-06-28T00:00:00Z"
      formattedDueDate="28 Jun"
      daysRemaining={5}
      onPay={noop}
    />
  )
}

describe("LoanEntry — one atom, due vs repaid", () => {
  it("shows the due row + Pay now when there is an outstanding balance", () => {
    renderLoan(1200)
    expect(screen.getByText("Loan repayment due:")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /pay now/i })).toBeInTheDocument()
  })

  it("shows the repaid summary and no Pay now when fully repaid", () => {
    renderLoan(0)
    expect(screen.getByText("Loan repaid")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /pay now/i })
    ).not.toBeInTheDocument()
  })

  it("shows an Overdue badge when the due date has passed", () => {
    render(
      <LoanEntry
        outstandingAmount={1200}
        amount={9500}
        currency="KES"
        dueDate="2026-06-28T00:00:00Z"
        formattedDueDate="28 Jun"
        daysRemaining={-3}
        onPay={noop}
      />
    )
    expect(screen.getByText("Overdue")).toBeInTheDocument()
  })
})

describe("resolveCashbackLabel — shared label logic", () => {
  const who = { isReceiver: false, isSender: false }

  it("frames incoming vs outgoing transfers by the current user", () => {
    expect(
      resolveCashbackLabel(
        {
          type: "TRANSFER",
          sender: { accountOwner: { firstName: "Wanjiru" } },
        },
        { isReceiver: true, isSender: false }
      )
    ).toBe("Received from Wanjiru")

    expect(
      resolveCashbackLabel(
        {
          type: "TRANSFER",
          receiver: { accountOwner: { firstName: "Brian" } },
        },
        { isReceiver: false, isSender: true }
      )
    ).toBe("Sent to Brian")
  })

  it("labels EARNED and SPENT transactions", () => {
    expect(resolveCashbackLabel({ type: "EARNED" }, who)).toBe(
      "Cashback earned"
    )
    expect(
      resolveCashbackLabel({ type: "SPENT", description: "Medical Bill" }, who)
    ).toBe("medical bill")
  })
})
