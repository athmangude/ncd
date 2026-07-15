import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement, type ReactNode } from "react"
import PaymentDetails from "./PaymentDetails"
import { useFastTrackStore } from "./useFastTrackStore"
import type { DiscountCode } from "../Dashboard/components/DiscountsSection"
import type { FastTrackPaymentPoint } from "./types"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: "/patients/fast-track/payment-details" }),
  }
})

const mockUser = {
  id: "u1",
  firstName: "Amina",
  lastName: "Otieno",
  phoneNumber: "+254712345678",
  idVerification: { photo: "" },
}

vi.mock("../../stores/patientAuthStore", () => ({
  usePatientAuthStore: Object.assign(() => ({ user: mockUser }), {
    getState: () => ({ user: mockUser }),
  }),
}))

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@amplitude/analytics-browser", () => ({
  getSessionId: () => "session-1",
}))

const welcomeDiscount: DiscountCode = {
  id: 1,
  code: "WELCOME15",
  description: "15% off your first facility payment with Jireh",
  discountType: "PERCENTAGE",
  discountValue: "15",
  currency: { id: 1, code: "KES", name: "Kenyan Shilling", symbol: "KES" },
  context: "PROMOTIONAL",
  discountAmount: "0",
  validFrom: null,
  validUntil: "2026-12-31T23:59:59.000Z",
  minimumOrderAmount: "1000",
  maximumDiscountAmount: "3000",
  isActive: true,
  isValid: true,
}

const pharmaDiscount: DiscountCode = {
  id: 4,
  code: "PHARMA5",
  description: "5% off pharmacy purchases at partner outlets",
  discountType: "PERCENTAGE",
  discountValue: "5",
  currency: { id: 1, code: "KES", name: "Kenyan Shilling", symbol: "KES" },
  context: "ORDER_BASED",
  discountAmount: "0",
  validFrom: null,
  validUntil: "2026-11-30T23:59:59.000Z",
  minimumOrderAmount: "500",
  maximumDiscountAmount: "1000",
  isActive: true,
  isValid: true,
}

vi.mock("../Dashboard/hooks/useEligibleDiscountCodes", () => ({
  useEligibleDiscountCodes: () => ({
    data: [welcomeDiscount, pharmaDiscount],
  }),
}))

const axiosGet = vi.fn()
const axiosPost = vi.fn()

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => axiosGet(...args),
    post: (...args: unknown[]) => axiosPost(...args),
  },
}))

// vaul (DiscountDetailsDrawer) reads matchMedia + pointer-capture APIs jsdom
// doesn't implement.
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

const mockProvider: FastTrackPaymentPoint = {
  id: 1,
  name: "Main Reception",
  paymentNumber: "123456",
  paymentCode: "123456",
  smsPhoneNumbers: [],
  isActive: true,
  facility: {
    id: 1,
    name: "Nairobi Hospital",
    address: "",
    POBox: null,
    orgName: "",
    facilityLevel: "",
    facilityVerificationStatus: "",
    locationName: null,
    county: null,
    subCounty: null,
    contactPhone: null,
    latitude: null,
    longitude: null,
    isOutOfNetwork: false,
    isPrimaryBranch: true,
    branchDisplayName: "Nairobi Hospital",
    createdAt: "",
    updatedAt: "",
    deletedAt: null,
  },
  createdAt: "",
  updatedAt: "",
  deletedAt: null,
}

beforeEach(() => {
  useFastTrackStore.setState({
    provider: mockProvider,
    invoiceNumber: "",
    invoiceAmount: "",
    selectedPatientId: "",
    discountCode: "",
    discountAmount: "0",
  })
  mockNavigate.mockClear()
  axiosGet.mockReset().mockResolvedValue({ data: { patients: [] } })
  axiosPost.mockReset()
})

function wrap(ui: ReactNode) {
  return createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(MemoryRouter, {}, ui)
  )
}

// PaymentDetails renders <LoadingPage /> while the patient-connections query
// is in flight; every test needs to wait that out before the form fields
// (Total Bill Amount, etc.) exist in the DOM.
async function renderReady() {
  render(wrap(createElement(PaymentDetails)))
  return screen.findByLabelText("Total Bill Amount")
}

describe("PaymentDetails — discount eligibility filtering", () => {
  it("only shows codes whose minimumOrderAmount the current bill meets", async () => {
    const amountInput = await renderReady()
    await userEvent.type(amountInput, "600")

    // PHARMA5 (min 500) should be offered; WELCOME15 (min 1000) should not.
    expect(await screen.findByText(/5% off pharmacy/i)).toBeInTheDocument()
    expect(screen.queryByText(/15% off your first/i)).not.toBeInTheDocument()
  })

  it("offers both codes once the bill clears every minimum", async () => {
    const amountInput = await renderReady()
    await userEvent.type(amountInput, "2500")

    expect(await screen.findByText(/5% off pharmacy/i)).toBeInTheDocument()
    expect(screen.getByText(/15% off your first/i)).toBeInTheDocument()
  })
})

describe("PaymentDetails — manually typed ineligible code still surfaces the error", () => {
  it("shows the minimum-order error returned by the API for a code the bill can't use", async () => {
    axiosPost.mockResolvedValue({
      data: {
        isValid: false,
        discountAmount: "0",
        message: "This code requires a minimum order of KES 1,000",
      },
    })

    const amountInput = await renderReady()
    await userEvent.type(amountInput, "300")
    await userEvent.type(
      screen.getByLabelText("Discount Code (Optional)"),
      "WELCOME15"
    )
    await userEvent.click(screen.getByRole("button", { name: /^apply$/i }))

    expect(
      await screen.findByText(/minimum order of kes 1,000/i)
    ).toBeInTheDocument()
    // The applied-discount card must never render for a rejected code.
    expect(
      screen.queryByLabelText("Remove discount code")
    ).not.toBeInTheDocument()
  })
})

describe("PaymentDetails — applying a discount collapses the input into a card", () => {
  it("replaces the input with an applied-discount card showing a trash icon button", async () => {
    axiosPost.mockResolvedValue({
      data: {
        isValid: true,
        discountAmount: "300",
        message: "Discount code applied",
      },
    })

    const amountInput = await renderReady()
    await userEvent.type(amountInput, "2000")
    await userEvent.type(
      screen.getByLabelText("Discount Code (Optional)"),
      "WELCOME15"
    )
    await userEvent.click(screen.getByRole("button", { name: /^apply$/i }))

    expect(await screen.findByText("WELCOME15")).toBeInTheDocument()
    expect(screen.getByLabelText("Remove discount code")).toBeInTheDocument()
    expect(
      screen.queryByLabelText("Discount Code (Optional)")
    ).not.toBeInTheDocument()
  })

  it("removes the applied discount and restores the input when the trash icon is clicked", async () => {
    axiosPost.mockResolvedValue({
      data: {
        isValid: true,
        discountAmount: "300",
        message: "Discount code applied",
      },
    })

    const amountInput = await renderReady()
    await userEvent.type(amountInput, "2000")
    await userEvent.type(
      screen.getByLabelText("Discount Code (Optional)"),
      "WELCOME15"
    )
    await userEvent.click(screen.getByRole("button", { name: /^apply$/i }))
    await screen.findByLabelText("Remove discount code")

    await userEvent.click(screen.getByLabelText("Remove discount code"))

    expect(
      await screen.findByLabelText("Discount Code (Optional)")
    ).toBeInTheDocument()
    expect(useFastTrackStore.getState().discountCode).toBe("")
    expect(useFastTrackStore.getState().discountAmount).toBe("0")
  })
})

describe("PaymentDetails — cashback banner never contradicts the minimum-bill error", () => {
  it("shows only the error, not the cashback banner, below the minimum bill amount", async () => {
    const amountInput = await renderReady()
    await userEvent.type(amountInput, "50")

    expect(
      await screen.findByText(/minimum bill amount is kes 150/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/pay the full bill via jireh/i)
    ).not.toBeInTheDocument()
  })

  it("shows only the banner, not the error, at/above the minimum bill amount", async () => {
    const amountInput = await renderReady()
    await userEvent.type(amountInput, "150")

    expect(
      await screen.findByText(/pay the full bill via jireh/i)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/minimum bill amount is kes 150/i)
    ).not.toBeInTheDocument()
  })
})

describe("PaymentDetails — discount re-validates when the bill amount changes", () => {
  it("re-triggers validation (debounced) when the amount changes after a discount is applied", async () => {
    axiosPost.mockResolvedValue({
      data: {
        isValid: true,
        discountAmount: "300",
        message: "Discount code applied",
      },
    })

    const amountInput = await renderReady()
    await userEvent.type(amountInput, "2000")
    await userEvent.type(
      screen.getByLabelText("Discount Code (Optional)"),
      "WELCOME15"
    )
    await userEvent.click(screen.getByRole("button", { name: /^apply$/i }))
    await screen.findByLabelText("Remove discount code")

    axiosPost.mockClear()
    axiosPost.mockResolvedValue({
      data: {
        isValid: true,
        discountAmount: "450",
        message: "Discount code applied",
      },
    })

    await userEvent.clear(screen.getByLabelText("Total Bill Amount"))
    await userEvent.type(screen.getByLabelText("Total Bill Amount"), "3000")

    await waitFor(
      () =>
        expect(axiosPost).toHaveBeenCalledWith(
          expect.stringContaining("/discount-codes/validate"),
          expect.objectContaining({ code: "WELCOME15" }),
          expect.anything()
        ),
      { timeout: 2000 }
    )
  })
})
