import {
  describe,
  it,
  expect,
  vi,
  beforeAll,
  beforeEach,
  afterEach,
} from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createElement, type ReactNode } from "react"
import { CircleWaitingDrawer } from "./CircleWaitingDrawer"
import type { ExtendedUser } from "./types"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return { ...actual, useNavigate: () => mockNavigate }
})

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

const baseUser: ExtendedUser = {
  wallets: [],
  name: "Mary Wanjiku",
  patientCircle: { filledAccountableSlots: 2, status: "ACTIVE" },
}

beforeEach(() => {
  // CircleWaitingDrawer pulls circle data via usePatientNetwork (React Query);
  // stub the fetch so the query resolves to an empty network.
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ network: [], invites: [], receivedInvites: [] }),
    })
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
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

describe("CircleWaitingDrawer", () => {
  it("renders title when open", () => {
    render(
      wrap(
        createElement(CircleWaitingDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          user: baseUser,
        })
      )
    )
    expect(
      screen.getByText("Waiting on your Circle members")
    ).toBeInTheDocument()
  })

  it("renders subtitle when open", () => {
    render(
      wrap(
        createElement(CircleWaitingDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          user: baseUser,
        })
      )
    )
    expect(screen.getByText(/Your invites were sent/)).toBeInTheDocument()
  })

  it("shows user initials derived from name", () => {
    render(
      wrap(
        createElement(CircleWaitingDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          user: baseUser,
        })
      )
    )
    expect(screen.getByText("MW")).toBeInTheDocument()
  })

  it("shows pending confirmation count from filledAccountableSlots", () => {
    render(
      wrap(
        createElement(CircleWaitingDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          user: baseUser,
        })
      )
    )
    expect(
      screen.getByText(/2 members pending confirmation/)
    ).toBeInTheDocument()
  })

  it("uses singular 'member' when filledAccountableSlots is 1", () => {
    const user: ExtendedUser = {
      ...baseUser,
      patientCircle: { filledAccountableSlots: 1 },
    }
    render(
      wrap(
        createElement(CircleWaitingDrawer, {
          isOpen: true,
          onClose: vi.fn(),
          user,
        })
      )
    )
    expect(
      screen.getByText(/1 member pending confirmation/)
    ).toBeInTheDocument()
  })

  it("navigates to invitations-sent and calls onClose when CTA clicked", async () => {
    const onClose = vi.fn()
    render(
      wrap(
        createElement(CircleWaitingDrawer, {
          isOpen: true,
          onClose,
          user: baseUser,
        })
      )
    )
    await userEvent.click(
      screen.getByRole("button", { name: /check invite status/i })
    )
    expect(onClose).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith(
      "/patients/network/invitations-sent"
    )
  })

  it("does not render content when closed", () => {
    render(
      wrap(
        createElement(CircleWaitingDrawer, {
          isOpen: false,
          onClose: vi.fn(),
          user: baseUser,
        })
      )
    )
    expect(
      screen.queryByText("Waiting on your Circle members")
    ).not.toBeInTheDocument()
  })
})
