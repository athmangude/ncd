import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientCircleSetupIntro from "./PatientCircleSetupIntro"

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { CIRCLE: { EMPTY_STATE_VIEW: "v", START_BUILDING_TAP: "t" } },
}))

// Non-empty network → CircleSetupContent renders its "My Jireh Circle" heading.
vi.mock("@/Routes/Patient/Pages/Network/hooks/useNetworkData", () => ({
  useNetworkData: () => ({
    data: {
      network: [{ id: "1", relationship: "SPOUSE", status: "ACTIVE" }],
      invites: [],
      receivedInvites: [],
      adults: [{ id: "1" }],
      children: [],
      isAllFull: false,
    },
    isLoading: false,
    isError: false,
  }),
}))

// Stub the heavy viz so the test stays fast and focused on the header.
vi.mock("./CircleNetworkViz", () => ({
  CircleNetworkViz: () => createElement("div", { "data-testid": "viz" }),
}))

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (
    sel: (s: { user: { firstName: string; lastName: string } }) => unknown
  ) => sel({ user: { firstName: "Amina", lastName: "K" } }),
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
  vi.clearAllMocks()
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
      { initialEntries: ["/patients/circle-setup-intro"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientCircleSetupIntro content-header migration", () => {
  it("shows 'My Jireh Circle' exactly once (app-bar title removed, content owns it)", () => {
    render(wrap(<PatientCircleSetupIntro />))

    // Previously the BackTitleHeader title duplicated CircleSetupContent's h1.
    expect(screen.getAllByText("My Jireh Circle")).toHaveLength(1)
  })

  it("renders 'My Jireh Circle' as the content heading", () => {
    render(wrap(<PatientCircleSetupIntro />))

    expect(
      screen.getByRole("heading", { name: "My Jireh Circle" })
    ).toBeInTheDocument()
  })
})
