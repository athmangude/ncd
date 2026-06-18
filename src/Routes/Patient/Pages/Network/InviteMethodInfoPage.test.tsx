import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import InviteMethodInfoPage from "./InviteMethodInfoPage"

const mockNavigate = vi.fn()

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...(actual as object),
    useNavigate: () => mockNavigate,
  }
})

const wrap = (ui: ReactNode, state: Record<string, unknown> = {}) =>
  createElement(
    MemoryRouter,
    {
      initialEntries: [
        { pathname: "/patients/network/invite-info", state },
      ],
    },
    ui
  )

describe("InviteMethodInfoPage — SMS (inviteMethod: text)", () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it("renders the shared title", () => {
    render(wrap(<InviteMethodInfoPage />, { inviteMethod: "text" }))
    expect(
      screen.getByText(/Start building your Circle/i)
    ).toBeInTheDocument()
  })

  it("shows 'Write your message' as step 02", () => {
    render(wrap(<InviteMethodInfoPage />, { inviteMethod: "text" }))
    expect(screen.getByText(/Write your message/i)).toBeInTheDocument()
  })

  it("does NOT show 'Record your message'", () => {
    render(wrap(<InviteMethodInfoPage />, { inviteMethod: "text" }))
    expect(screen.queryByText(/Record your message/i)).not.toBeInTheDocument()
  })

  it("navigates to add-circle-member with inviteMethod=text on Continue", () => {
    render(wrap(<InviteMethodInfoPage />, { inviteMethod: "text" }))
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }))
    expect(mockNavigate).toHaveBeenCalledWith(
      "/patients/network/add-circle-member",
      expect.objectContaining({
        state: expect.objectContaining({ inviteMethod: "text" }),
      })
    )
  })
})

describe("InviteMethodInfoPage — Voice (inviteMethod: voice)", () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it("shows 'Record your message' as step 02", () => {
    render(wrap(<InviteMethodInfoPage />, { inviteMethod: "voice" }))
    expect(screen.getByText(/Record your message/i)).toBeInTheDocument()
  })

  it("does NOT show 'Write your message'", () => {
    render(wrap(<InviteMethodInfoPage />, { inviteMethod: "voice" }))
    expect(screen.queryByText(/Write your message/i)).not.toBeInTheDocument()
  })

  it("navigates to add-circle-member with inviteMethod=voice on Continue", () => {
    render(wrap(<InviteMethodInfoPage />, { inviteMethod: "voice" }))
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }))
    expect(mockNavigate).toHaveBeenCalledWith(
      "/patients/network/add-circle-member",
      expect.objectContaining({
        state: expect.objectContaining({ inviteMethod: "voice" }),
      })
    )
  })
})
