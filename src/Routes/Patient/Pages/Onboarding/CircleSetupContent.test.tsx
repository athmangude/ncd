import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import { CircleSetupContent } from "./CircleSetupContent"
import { EVENTS } from "@/analytics"

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockTrackEvent = vi.fn()

vi.mock("@/analytics", async () => {
  const actual = await vi.importActual<typeof import("@/analytics")>("@/analytics")
  return {
    ...actual,
    trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  }
})

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (
    sel: (s: { user: { firstName: string; lastName: string } }) => unknown
  ) => sel({ user: { firstName: "Test", lastName: "User" } }),
}))

// ── Helpers ────────────────────────────────────────────────────────────────

function stubNetwork(
  network: unknown[] = [],
  invites: unknown[] = [],
  receivedInvites: unknown[] = []
) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ network, invites, receivedInvites }),
    })
  )
}

function wrap(ui: ReactNode) {
  return createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    createElement(MemoryRouter, { initialEntries: ["/patients/circle"] }, ui)
  )
}

function renderContent(props: Partial<Parameters<typeof CircleSetupContent>[0]> = {}) {
  return render(
    wrap(
      createElement(CircleSetupContent, {
        onAddMember: vi.fn(),
        onNodeClick: vi.fn(),
        onLearnMore: vi.fn(),
        ...props,
      })
    )
  )
}

const member = {
  id: "m1",
  firstName: "Mary",
  lastName: "Wanjiku",
  phoneNumber: "254712345678",
  relationship: "FRIEND",
  status: "ACTIVE",
  profilePhoto: null,
  joinedAt: "2020-01-01T00:00:00.000Z",
  hasDefaultedLoan: false,
}

const sentInvite = {
  id: "i1",
  firstName: "John",
  lastName: "Kamau",
  phoneNumber: "254787654321",
  status: "PENDING",
  profilePhoto: null,
}

const received = {
  id: "r1",
  inviterFirstName: "Grace",
  inviterLastName: "Hopper",
  phoneNumber: "254700000000",
  status: "PENDING",
  profilePhoto: null,
}

beforeEach(() => {
  mockTrackEvent.mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// ── Tests ────────────────────────────────────────────────────────────────────

describe("CircleSetupContent — empty state", () => {
  it("renders the placeholder illustration and 'Start building your Circle' CTA when there are no members or invites", async () => {
    stubNetwork([], [], [])
    renderContent()

    expect(
      await screen.findByRole("button", { name: /start building your circle/i })
    ).toBeInTheDocument()
    expect(
      screen.getByAltText(/a circle of people connected together/i)
    ).toBeInTheDocument()
    // No viz child-node container in the empty state.
    expect(screen.queryByTestId("child-nodes")).not.toBeInTheDocument()
  })

  it("tracks EMPTY_STATE_VIEW when the empty state renders", async () => {
    stubNetwork([], [], [])
    renderContent()

    await waitFor(() =>
      expect(mockTrackEvent).toHaveBeenCalledWith(EVENTS.CIRCLE.EMPTY_STATE_VIEW)
    )
  })

  it("calls onAddMember and tracks START_BUILDING_TAP with firstInvite=true on CTA tap", async () => {
    stubNetwork([], [], [])
    const onAddMember = vi.fn()
    renderContent({ onAddMember })

    const cta = await screen.findByRole("button", {
      name: /start building your circle/i,
    })
    await userEvent.click(cta)

    expect(onAddMember).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith(
      EVENTS.CIRCLE.START_BUILDING_TAP,
      { firstInvite: true }
    )
  })
})

describe("CircleSetupContent — populated state", () => {
  it("renders the visualization and 'Add new member' CTA when a member exists", async () => {
    stubNetwork([member], [], [])
    renderContent()

    // child-nodes only renders once the viz leaves its loading skeleton.
    expect(await screen.findByTestId("child-nodes")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /add new member/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByAltText(/a circle of people connected together/i)
    ).not.toBeInTheDocument()
    expect(mockTrackEvent).not.toHaveBeenCalledWith(EVENTS.CIRCLE.EMPTY_STATE_VIEW)
  })

  it("treats a pending sent invite (no active members) as populated", async () => {
    stubNetwork([], [sentInvite], [])
    renderContent()

    expect(await screen.findByTestId("child-nodes")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /add new member/i })
    ).toBeInTheDocument()
  })

  it("treats a received invite (no active members) as populated", async () => {
    stubNetwork([], [], [received])
    renderContent()

    expect(await screen.findByTestId("child-nodes")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /add new member/i })
    ).toBeInTheDocument()
  })

  it("fires START_BUILDING_TAP with firstInvite=false from a populated state", async () => {
    stubNetwork([member], [], [])
    const onAddMember = vi.fn()
    renderContent({ onAddMember })

    await screen.findByTestId("child-nodes")
    const cta = screen.getByRole("button", { name: /add new member/i })
    await userEvent.click(cta)

    expect(onAddMember).toHaveBeenCalledTimes(1)
    expect(mockTrackEvent).toHaveBeenCalledWith(
      EVENTS.CIRCLE.START_BUILDING_TAP,
      { firstInvite: false }
    )
  })
})

describe("CircleSetupContent — learn more", () => {
  it("calls onLearnMore when 'What is a Circle?' is tapped", async () => {
    stubNetwork([], [], [])
    const onLearnMore = vi.fn()
    renderContent({ onLearnMore })

    const link = await screen.findByRole("button", { name: /what is a circle/i })
    await userEvent.click(link)
    expect(onLearnMore).toHaveBeenCalledTimes(1)
  })
})
