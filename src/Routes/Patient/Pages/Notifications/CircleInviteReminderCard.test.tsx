import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CircleInviteReminderCard } from "./CircleInviteReminderCard"

const mockNavigate = vi.fn()
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}))

const base = {
  invitationId: "invite-uuid-abc",
  inviteeFirstName: "John",
  sentAt: "2026-05-25T10:00:00Z",
  readStatus: "UNREAD" as const,
}

beforeEach(() => {
  mockNavigate.mockReset()
})

describe("CircleInviteReminderCard — 4h variant (CIRCLE_INVITE_4H_OWNER)", () => {
  it("renders 'Still waiting on John?' as the title", () => {
    render(
      <CircleInviteReminderCard
        {...base}
        subType="CIRCLE_INVITE_4H_OWNER"
      />,
    )
    expect(
      screen.getByText("Still waiting on John?"),
    ).toBeInTheDocument()
  })

  it("renders the correct body text", () => {
    render(
      <CircleInviteReminderCard
        {...base}
        subType="CIRCLE_INVITE_4H_OWNER"
      />,
    )
    expect(
      screen.getByText("Resend or invite someone else to join your Circle."),
    ).toBeInTheDocument()
  })

  it("renders 'View details' and 'Resend invite' buttons", () => {
    render(
      <CircleInviteReminderCard
        {...base}
        subType="CIRCLE_INVITE_4H_OWNER"
      />,
    )
    expect(screen.getByRole("button", { name: /view details/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /resend invite/i })).toBeInTheDocument()
  })

  it("navigates to /patients/network with invitationId on 'Resend invite' click", async () => {
    render(
      <CircleInviteReminderCard
        {...base}
        subType="CIRCLE_INVITE_4H_OWNER"
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /resend invite/i }))

    expect(mockNavigate).toHaveBeenCalledWith("/patients/network", {
      state: { invitationId: "invite-uuid-abc" },
    })
  })

  it("navigates to /patients/network with invitationId on 'View details' click", async () => {
    render(
      <CircleInviteReminderCard
        {...base}
        subType="CIRCLE_INVITE_4H_OWNER"
      />,
    )
    await userEvent.click(screen.getByRole("button", { name: /view details/i }))

    expect(mockNavigate).toHaveBeenCalledWith("/patients/network", {
      state: { invitationId: "invite-uuid-abc" },
    })
  })
})

describe("CircleInviteReminderCard — 24h variant (CIRCLE_INVITE_24H_OWNER)", () => {
  it("renders 'Invite someone else?' as the title", () => {
    render(
      <CircleInviteReminderCard
        {...base}
        subType="CIRCLE_INVITE_24H_OWNER"
      />,
    )
    expect(screen.getByText("Invite someone else?")).toBeInTheDocument()
  })

  it("renders 'John has not responded to your invite.' as body", () => {
    render(
      <CircleInviteReminderCard
        {...base}
        subType="CIRCLE_INVITE_24H_OWNER"
      />,
    )
    expect(
      screen.getByText("John has not responded to your invite."),
    ).toBeInTheDocument()
  })

  it("renders 'Invite another person' button but NOT 'View details' or 'Resend invite'", () => {
    render(
      <CircleInviteReminderCard
        {...base}
        subType="CIRCLE_INVITE_24H_OWNER"
      />,
    )
    expect(
      screen.getByRole("button", { name: /invite another person/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /view details/i }),
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: /resend invite/i }),
    ).toBeNull()
  })

  it("navigates to /patients/network with invitationId on 'Invite another person' click", async () => {
    render(
      <CircleInviteReminderCard
        {...base}
        subType="CIRCLE_INVITE_24H_OWNER"
      />,
    )
    await userEvent.click(
      screen.getByRole("button", { name: /invite another person/i }),
    )

    expect(mockNavigate).toHaveBeenCalledWith("/patients/network", {
      state: { invitationId: "invite-uuid-abc" },
    })
  })
})
