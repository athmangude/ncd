import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  PaymentRequestsSection,
  type PaymentRequest,
} from "./PaymentRequestsSection"

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

const request: PaymentRequest = {
  id: "req-1",
  careProviderName: "Aga Khan Hospital",
  billAmount: "1500",
  paymentInfo: {
    type: "paybill",
    tillNumber: "",
    paybillNumber: "123456",
    accountNumber: "acct-1",
  },
  reason: null,
  status: "PENDING",
  createdAt: new Date(2026, 6, 1).toISOString(),
  updatedAt: new Date(2026, 6, 1).toISOString(),
  patient: {
    id: "p-1",
    firstName: "Amina",
    lastName: "Otieno",
    phoneNumber: "+254700000000",
    email: "amina@example.com",
  },
  dependent: null,
  kmpdcFacility: { id: "f-1", name: "Aga Khan" },
  invoiceFile: {
    id: "file-1",
    filePath: "/x",
    originalFileName: "invoice.pdf",
    url: "/x",
  },
}

const renderSection = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <PaymentRequestsSection requests={[request]} />
      </MemoryRouter>
    </QueryClientProvider>
  )

describe("PaymentRequestsSection action buttons", () => {
  it("renders 'Send Payment' as a Button secondary variant (not a raw bg-purple-100 <button>)", () => {
    renderSection()
    const send = screen.getByRole("button", { name: "Send Payment" })
    expect(send.className).toContain("bg-secondary")
    expect(send.className).not.toContain("bg-purple-100")
  })

  it("renders the delete action as a Button destructive variant", () => {
    renderSection()
    const del = screen.getByRole("button", { name: "Delete payment request" })
    expect(del.className).toContain("bg-destructive")
    expect(del.className).not.toContain("bg-red-100")
  })
})
