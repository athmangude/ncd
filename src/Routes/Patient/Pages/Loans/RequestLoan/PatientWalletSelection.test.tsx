import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientWalletSelection from "./PatientWalletSelection"

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({
      pathname: "/patients/wallet-selection",
      state: {
        totalBillAmount: 1000,
        originalBillAmount: 1000,
        wallets: [
          {
            id: "loan-1",
            type: "LOAN",
            remainingBalance: "0",
            createdAt: "",
            updatedAt: "",
          },
          {
            id: "mpesa-1",
            type: "MPESA",
            remainingBalance: "0",
            createdAt: "",
            updatedAt: "",
          },
        ],
      },
    }),
  }
})

const mockUser = {
  id: "u1",
  name: "Test User",
  type: "PLUS",
  hasActiveMembership: true,
  wallets: [
    {
      id: "loan-1",
      type: "LOAN",
      remainingBalance: "0",
      createdAt: "",
      updatedAt: "",
    },
    {
      id: "mpesa-1",
      type: "MPESA",
      remainingBalance: "0",
      createdAt: "",
      updatedAt: "",
    },
  ],
  patientCircle: {
    filledAccountableSlots: 1,
    status: "ACTIVE",
    isFrozen: false,
  },
}

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: Object.assign(() => ({ user: mockUser }), {
    getState: () => ({ user: mockUser }),
  }),
}))

vi.mock("@/Routes/Patient/hooks/useNextLoanApplicationStep", () => ({
  default: () => "/patients/payment-confirmation",
  LOAN_APPLICATION_STEPS: [],
  loanApplicationRoutes: new Map(),
}))

vi.mock("@/Routes/Patient/hooks/usePaymentHistory", () => ({
  usePaymentHistory: () => ({ data: null }),
}))

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("./NotificationPermissionDrawer", () => ({
  NotificationPermissionDrawer: () => null,
  useNotificationFlow: () => ({
    isOpen: false,
    close: vi.fn(),
    isRequesting: false,
    showHelp: false,
    checkAndProceed: (_cb: () => void) => _cb(),
    handleEnable: vi.fn(),
    handleSkip: vi.fn(),
  }),
}))

vi.mock("./WalletDrawer", () => ({
  WalletDrawer: () => null,
}))

vi.mock("axios", () => ({
  default: { post: vi.fn() },
}))

beforeAll(() => {
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

afterEach(() => {
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
    createElement(
      MemoryRouter,
      { initialEntries: ["/patients/wallet-selection"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientWalletSelection — loan wallet circle-criteria state", () => {
  it("shows orange badge when Plus user has insufficient circle members", () => {
    render(wrap(createElement(PatientWalletSelection)))
    expect(
      screen.getByText(/Waiting on 2 Circle members/)
    ).toBeInTheDocument()
  })

  it("does not show the gray lock message when circle criteria not met", () => {
    render(wrap(createElement(PatientWalletSelection)))
    expect(
      screen.queryByText(/Add at least 2 adult circle members/)
    ).not.toBeInTheDocument()
  })

  it("opens CircleWaitingDrawer when orange badge is clicked", async () => {
    render(wrap(createElement(PatientWalletSelection)))
    await userEvent.click(screen.getByText(/Waiting on 2 Circle members/))
    expect(
      screen.getByText("Waiting on your Circle members")
    ).toBeInTheDocument()
  })
})
