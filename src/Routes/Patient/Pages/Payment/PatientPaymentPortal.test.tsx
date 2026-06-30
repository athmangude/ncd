import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement } from "react"
import PaymentPortal from "./PatientPaymentPortal"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ toast: vi.fn() }) }))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: {
    LOAN_REPAYMENT: {
      PAYMENT_SUBMIT: "s",
      PAYMENT_SUCCESS: "ok",
      PAYMENT_ERROR: "e",
      PAYMENT_VIEW: "v",
    },
  },
}))
vi.mock("@/analytics/metadata", () => ({ safeAmount: (n: number) => n }))

const postMock = vi.fn()
vi.mock("axios", () => ({
  default: { post: (...a: unknown[]) => postMock(...a) },
}))

// vaul reads matchMedia + pointer-capture APIs that jsdom doesn't implement.
beforeAll(() => {
  Element.prototype.setPointerCapture ??= vi.fn()
  Element.prototype.releasePointerCapture ??= vi.fn()
  Element.prototype.hasPointerCapture ??= vi.fn(() => false)
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
})

beforeEach(() => {
  mockNavigate.mockReset()
  postMock.mockReset()
})

function renderPortal(client: QueryClient) {
  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(
        MemoryRouter,
        {},
        createElement(PaymentPortal, {
          loanId: 7,
          initialPaymentAmount: 300,
          maxPayableAmount: 500,
          amountIsChangeable: true,
          title: "Make Loan Payment",
          description: "Payment for treatment",
          isTransactionFeePayment: false,
          children: createElement("button", {}, "Open"),
        })
      )
    )
  )
}

describe("PaymentPortal repayment", () => {
  it("invalidates every balance/view query after a successful repayment", async () => {
    postMock.mockResolvedValue({
      data: { isChargeTransaction: true, reference: "ref-1" },
    })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(client, "invalidateQueries")

    const user = userEvent.setup()
    renderPortal(client)

    await user.click(screen.getByRole("button", { name: "Open" }))
    await user.click(await screen.findByRole("button", { name: "Pay" }))

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1))

    const invalidatedKeys = invalidateSpy.mock.calls.map(
      (c) => (c[0] as { queryKey: string[] }).queryKey[0]
    )
    for (const key of [
      "loanStats",
      "paymentHistory",
      "careFundTransactions",
      "getPatientLoanDetails",
      "patientLoginDetails",
    ]) {
      expect(invalidatedKeys).toContain(key)
    }

    // And it forwards to the in-app transaction result screen.
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "/patients/transaction-result?reference=ref-1"
      )
    )
  })

  it("posts the entered repayment amount and loan id", async () => {
    postMock.mockResolvedValue({
      data: { isChargeTransaction: true, reference: "ref-2" },
    })
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const user = userEvent.setup()
    renderPortal(client)

    await user.click(screen.getByRole("button", { name: "Open" }))
    await user.click(await screen.findByRole("button", { name: "Pay" }))

    await waitFor(() => expect(postMock).toHaveBeenCalledTimes(1))
    expect(postMock).toHaveBeenCalledWith(
      expect.stringContaining("/loans/patient/me/initiate-repayment"),
      expect.objectContaining({ amount: 300, loanId: 7 })
    )
  })
})
