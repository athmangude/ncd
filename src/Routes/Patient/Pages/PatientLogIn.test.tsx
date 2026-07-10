import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

vi.mock("@/hooks/useToast", () => ({ toast: vi.fn() }))

vi.mock("@/utilities/validators", () => ({ validatePhoneNumber: () => true }))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  maskPhoneNumber: (n: string) => n,
  EVENTS: {
    SIGNIN: { PHONE_ENTRY_VIEW: "view", PHONE_ENTRY_SUBMIT: "submit" },
  },
}))

// The OTP step self-shells via its own page wrapper; stub it so we can assert
// PatientLogIn renders it WITHOUT wrapping it in a second shell.
vi.mock("../components/VerifyOTPForm", () => ({
  default: () => createElement("main", null, "otp-step"),
}))

import PatientLogIn from "./PatientLogIn"

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(MemoryRouter, null, ui)
  )

describe("PatientLogIn (footer migration + single shell)", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("renders a footer Send OTP button wired to submit the login form", () => {
    render(wrap(<PatientLogIn />))
    const send = screen.getByRole("button", { name: "Send OTP" })
    expect(send).toHaveAttribute("form", "patient-login-form")
    expect(send).toHaveAttribute("type", "submit")
  })

  it("advances to the OTP step as a single shell (no nested AppShell)", async () => {
    render(wrap(<PatientLogIn />))

    fireEvent.change(screen.getByPlaceholderText("Enter your phone number"), {
      target: { value: "712345678" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Send OTP" }))

    expect(await screen.findByText("otp-step")).toBeInTheDocument()
    // The OTP branch is rendered bare (it owns its own shell) — exactly one <main>.
    expect(screen.getAllByRole("main")).toHaveLength(1)
  })
})
