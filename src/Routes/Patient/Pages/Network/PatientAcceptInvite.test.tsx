import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ toast: vi.fn() }) }))

vi.mock("@/hooks/usePatientLoginDetails", () => ({
  usePatientLoginDetails: () => ({ data: undefined }),
}))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: {
    CIRCLE: {
      INVITATION_VIEW: "view",
      INVITATION_ACCEPT: "accept",
      INVITATION_REJECT: "reject",
      INVITATION_AUDIO_PLAY: "play",
      INVITATION_AUDIO_PAUSE: "pause",
    },
  },
}))

const getMock = vi.fn()
vi.mock("axios", async () => {
  const actual = await vi.importActual<typeof import("axios")>("axios")
  return {
    default: { get: (...a: unknown[]) => getMock(...a) },
    HttpStatusCode: actual.HttpStatusCode,
  }
})

import PatientAcceptInvite from "./PatientAcceptInvite"

const wrap = (ui: ReactNode, route = "/patients/network/accept-invite") =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(MemoryRouter, { initialEntries: [route] }, ui)
  )

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

describe("PatientAcceptInvite (AppShell migration)", () => {
  beforeEach(() => {
    localStorage.clear()
    getMock.mockReset()
  })

  it("renders the no-invite state inside the shell", async () => {
    render(wrap(<PatientAcceptInvite />))
    expect(await screen.findByText("No invite found")).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Return to Dashboard" })
    ).toBeInTheDocument()
  })

  it("renders the invite landing with a pinned footer CTA", async () => {
    getMock.mockResolvedValue({
      data: {
        referrerFirstName: "Jane",
        referrerLastName: "Doe",
        inviteId: "i1",
        status: "PENDING",
      },
    })

    render(
      wrap(
        <PatientAcceptInvite />,
        "/patients/network/accept-invite?inviteId=i1"
      )
    )

    expect(
      await screen.findByRole("button", { name: "Read Terms & Accept invite" })
    ).toBeInTheDocument()
    expect(screen.getByRole("main")).toBeInTheDocument()
  })

  it("shows the accept/decline actions in the shell footer after reading terms", async () => {
    getMock.mockResolvedValue({
      data: {
        referrerFirstName: "Jane",
        referrerLastName: "Doe",
        inviteId: "i1",
        status: "PENDING",
      },
    })

    render(
      wrap(
        <PatientAcceptInvite />,
        "/patients/network/accept-invite?inviteId=i1"
      )
    )

    fireEvent.click(
      await screen.findByRole("button", { name: "Read Terms & Accept invite" })
    )

    // The relocated footer bar (formerly a fixed bottom-0 wrapper) now lives in
    // the AppShell footer slot.
    expect(
      screen.getByRole("button", { name: "Accept & Join Circle" })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Decline Invite" })
    ).toBeInTheDocument()
  })
})
