import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"

const navigateMock = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  )
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useParams: () => ({ targetId: "member-1" }),
  }
})

const useMemberByIdMock = vi.fn()
vi.mock("./hooks/useMemberById", () => ({
  useMemberById: () => useMemberByIdMock(),
}))

vi.mock("../../stores/patientAuthStore", () => ({
  usePatientAuthStore: (sel: (s: { user: unknown }) => unknown) =>
    sel({ user: { firstName: "Ada", lastName: "L", profilePhoto: null } }),
}))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { CIRCLE: { MEMBER_DETAILS_VIEW: "circle_member_details_view" } },
}))

vi.mock("./lib/getMemberDetailsVariant", () => ({
  getMemberDetailsVariant: () => "connected-new",
}))

vi.mock("./components/memberDetails/bodies/ConnectedNewBody", () => ({
  ConnectedNewBody: () => createElement("div", null, "Connected New Body"),
}))
vi.mock("./components/memberDetails/bodies/ConnectedEstablishedBody", () => ({
  ConnectedEstablishedBody: () => createElement("div", null, "Established"),
}))
vi.mock("./components/memberDetails/bodies/PendingInviteBody", () => ({
  PendingInviteBody: () => createElement("div", null, "Pending"),
}))
vi.mock("./components/memberDetails/bodies/RejectedInviteBody", () => ({
  RejectedInviteBody: () => createElement("div", null, "Rejected"),
}))

import PatientCircleMemberDetails from "./PatientCircleMemberDetails"

const wrap = (ui: ReactNode) =>
  createElement(MemoryRouter, { initialEntries: ["/patients/network/member-1"] }, ui)

describe("PatientCircleMemberDetails (MobileWrapper migration)", () => {
  beforeEach(() => {
    navigateMock.mockClear()
  })

  it("renders the header title", () => {
    useMemberByIdMock.mockReturnValue({
      subject: null,
      kind: null,
      isLoading: true,
      notFound: false,
    })
    render(wrap(<PatientCircleMemberDetails />))
    expect(screen.getByText("Circle member details")).toBeInTheDocument()
  })

  it("shows the loading skeleton while loading", () => {
    useMemberByIdMock.mockReturnValue({
      subject: null,
      kind: null,
      isLoading: true,
      notFound: false,
    })
    render(wrap(<PatientCircleMemberDetails />))
    expect(screen.getByTestId("member-details-skeleton")).toBeInTheDocument()
  })

  it("renders the variant body once loaded", () => {
    useMemberByIdMock.mockReturnValue({
      subject: { id: "member-1" },
      kind: "connection",
      isLoading: false,
      notFound: false,
    })
    render(wrap(<PatientCircleMemberDetails />))
    expect(screen.getByText("Connected New Body")).toBeInTheDocument()
  })

  it("shows the not-found message when the member is gone", () => {
    useMemberByIdMock.mockReturnValue({
      subject: null,
      kind: null,
      isLoading: false,
      notFound: true,
    })
    render(wrap(<PatientCircleMemberDetails />))
    expect(
      screen.getByText(/no longer in your Circle/i)
    ).toBeInTheDocument()
  })

  it("navigates back when the header back button is pressed", () => {
    useMemberByIdMock.mockReturnValue({
      subject: null,
      kind: null,
      isLoading: true,
      notFound: false,
    })
    render(wrap(<PatientCircleMemberDetails />))
    // The header back button is the first button on the screen.
    fireEvent.click(screen.getAllByRole("button")[0])
    expect(navigateMock).toHaveBeenCalledWith(-1)
  })
})
