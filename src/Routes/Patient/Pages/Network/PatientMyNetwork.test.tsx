import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"

const networkState = {
  data: {
    network: [],
    invites: [],
    receivedInvites: [],
    slots: undefined,
    adults: [],
    children: [],
    isAllFull: false,
    accountableSlotsAvailable: 0,
    accountableSlotsMax: 0,
  },
  isLoading: false,
  isError: false,
  error: null,
}

const navigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => navigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

vi.mock("./hooks/useNetworkData", () => ({
  useNetworkData: () => networkState,
}))
vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { CIRCLE: { NETWORK_VIEW: "network_view" } },
}))
vi.mock("./components/InviteCard", () => ({
  InviteCard: () => createElement("div", null, "invite-card"),
}))
vi.mock("./components/InvitationsReceivedSection", () => ({
  InvitationsReceivedSection: () => null,
}))
vi.mock("./components/InvitationsSentSection", () => ({
  InvitationsSentSection: () => null,
}))
vi.mock("./components/ActiveMembersSection", () => ({
  ActiveMembersSection: () => null,
}))
vi.mock("./components/NetworkSkeleton", () => ({
  NetworkSkeleton: () => null,
}))

import PatientMyNetworkPage from "./PatientMyNetwork"

const wrap = (ui: ReactNode) => createElement(MemoryRouter, null, ui)

describe("PatientMyNetwork (AddMemberButton → footer slot)", () => {
  beforeEach(() => {
    networkState.data.isAllFull = false
    navigate.mockClear()
  })

  it("pins the Add-member CTA in the shell footer", () => {
    render(wrap(<PatientMyNetworkPage />))
    expect(screen.getByRole("main")).toBeInTheDocument()
    const cta = screen.getByRole("button", { name: "Add New member" })
    expect(cta).toBeInTheDocument()
    fireEvent.click(cta)
    expect(navigate).toHaveBeenCalledWith(
      "/patients/circle-setup-intro",
      expect.objectContaining({
        state: { source: "network", returnPath: "/patients/network" },
      })
    )
  })

  it("disables the CTA when the circle is full", () => {
    networkState.data.isAllFull = true
    render(wrap(<PatientMyNetworkPage />))
    const cta = screen.getByRole("button", { name: "Max circle size reached" })
    expect(cta).toBeDisabled()
  })
})
