import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement, type ReactNode } from "react"
import FastTrackWalletSelection from "./FastTrackWalletSelection"
import { useFastTrackStore } from "./useFastTrackStore"
import type { ExtendedUser, WalletItem } from "../Loans/RequestLoan/types"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

const mpesaWallet: WalletItem = {
  id: "mpesa-1",
  type: "MPESA",
  remainingBalance: "0",
  createdAt: "",
  updatedAt: "",
}

const loanWallet: WalletItem = {
  id: "loan-1",
  type: "LOAN",
  remainingBalance: "0",
  createdAt: "",
  updatedAt: "",
}

const cashbackWallet: WalletItem = {
  id: "cashback-1",
  type: "CASHBACK",
  remainingBalance: "1850",
  createdAt: "",
  updatedAt: "",
}

// A fully-eligible PLUS user (active membership + circle criteria met) so the
// LOAN wallet's balance description renders in the unallocated-loan test.
const eligibleUser: ExtendedUser = {
  id: "u1",
  wallets: [mpesaWallet, loanWallet, cashbackWallet],
  phoneNumber: "+254712345678",
  type: "PLUS",
  hasActiveMembership: true,
  creditLimit: {
    totalCreditLimitAmount: "5000",
    remainingAmount: "3200",
    currency: { code: "KES" },
  },
  patientCircle: {
    filledAccountableSlots: 2,
    status: "ACTIVE",
    isFrozen: false,
  },
}

let mockUser: ExtendedUser = eligibleUser

vi.mock("../../stores/patientAuthStore", () => ({
  usePatientAuthStore: Object.assign(() => ({ user: mockUser }), {
    getState: () => ({ user: mockUser }),
  }),
}))

vi.mock("@/Routes/Patient/hooks/usePaymentHistory", () => ({
  usePaymentHistory: () => ({
    data: {
      careFundAccount: {
        careFundBalance: "1850",
        currency: { code: "KES" },
      },
    },
  }),
}))

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("../Loans/RequestLoan/WalletDrawer", () => ({
  WalletDrawer: () => null,
}))

vi.mock("../Loans/RequestLoan/CircleWaitingDrawer", () => ({
  CircleWaitingDrawer: () => null,
}))

// vaul (used by CircleWaitingDrawer/WalletDrawer's Drawer even when mocked
// away here indirectly via PatientPageWrapper's own overlays) reads
// matchMedia + pointer-capture APIs jsdom doesn't implement.
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
  mockUser = eligibleUser
  useFastTrackStore.setState({
    invoiceAmount: "5000",
    discountAmount: "0",
    allocations: {},
  })
  mockNavigate.mockClear()
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

describe("FastTrackWalletSelection — 'Add source of funds' item titles", () => {
  it("shows the MPESA phone number in brackets, with no separate description line", () => {
    render(wrap(createElement(FastTrackWalletSelection)))
    expect(screen.getByText("MPESA (+254712345678)")).toBeInTheDocument()
  })

  it("shows the LOAN item title as 'Jireh Medical Loan' with an 'Available to borrow' description", () => {
    render(wrap(createElement(FastTrackWalletSelection)))
    expect(screen.getByText("Jireh Medical Loan")).toBeInTheDocument()
    expect(
      screen.getByText("Available to borrow: KES 3,200")
    ).toBeInTheDocument()
  })

  it("shows the CASHBACK item title as 'Jireh Cashback earned' with a 'Balance' description", () => {
    render(wrap(createElement(FastTrackWalletSelection)))
    expect(screen.getByText("Jireh Cashback earned")).toBeInTheDocument()
    expect(screen.getByText("Balance: KES 1,850")).toBeInTheDocument()
  })
})

describe("FastTrackWalletSelection — disabled LOAN item before upgrade", () => {
  it("still shows the Upgrade-to-Plus lock state for a non-Plus user", () => {
    mockUser = {
      ...eligibleUser,
      type: "PUBLIC",
      hasActiveMembership: false,
    }
    render(wrap(createElement(FastTrackWalletSelection)))
    expect(
      screen.getByText("Upgrade to Jireh Plus to unlock")
    ).toBeInTheDocument()
    expect(screen.getByText("Upgrade")).toBeInTheDocument()
  })
})

describe("FastTrackWalletSelection — progress bar uses the shared Progress component", () => {
  it("renders a real progressbar role, not a bare div", () => {
    render(wrap(createElement(FastTrackWalletSelection)))
    expect(screen.getByRole("progressbar")).toBeInTheDocument()
  })
})
