import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const navigateMock = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  )
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({ state: null, pathname: "/patients/set-pin" }),
  }
})

const toastMock = vi.fn()
vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ toast: toastMock }) }))

vi.mock("../../hooks/useNextOnboardingStep", () => ({
  default: () => "/patients/next-step",
}))

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { SIGNUP: { SET_PIN_VIEW: "view", SET_PIN_SUBMIT: "submit" } },
}))

const postMock = vi.fn().mockResolvedValue({ data: { success: true } })
vi.mock("axios", () => ({ default: { post: (...a: unknown[]) => postMock(...a) } }))

import PatientSetPin from "./PatientSetPin"

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    createElement(MemoryRouter, { initialEntries: ["/patients/set-pin"] }, ui)
  )

const typePin = (value: string) => {
  const input = document.querySelector("input") as HTMLInputElement
  fireEvent.change(input, { target: { value } })
}

describe("PatientSetPin (MobileWrapper migration)", () => {
  beforeEach(() => {
    navigateMock.mockClear()
    toastMock.mockClear()
    postMock.mockClear()
  })

  it("shows the step-1 header title and a disabled Save PIN footer", () => {
    render(wrap(<PatientSetPin />))
    // BackTitleHeader title + body heading both read "Create your PIN".
    expect(screen.getAllByText("Create your PIN").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Save PIN" })).toBeDisabled()
  })

  it("enables Save PIN once a 4-digit PIN is entered", () => {
    render(wrap(<PatientSetPin />))
    typePin("1234")
    expect(screen.getByRole("button", { name: "Save PIN" })).not.toBeDisabled()
  })

  it("advances to the confirm step", () => {
    render(wrap(<PatientSetPin />))
    typePin("1234")
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }))
    expect(screen.getAllByText("Confirm your PIN").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })

  it("shows a mismatch error when confirm PIN differs", () => {
    render(wrap(<PatientSetPin />))
    typePin("1234")
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }))
    typePin("5678")
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(screen.getByText(/PINs do not match/i)).toBeInTheDocument()
    expect(postMock).not.toHaveBeenCalled()
  })

  it("submits a matching PIN and redirects via the next step", async () => {
    render(wrap(<PatientSetPin />))
    typePin("1234")
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }))
    typePin("1234")
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    await waitFor(() => expect(postMock).toHaveBeenCalled())
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/patients/next-step")
    )
  })

  it("Back from step 1 navigates to the previous route", () => {
    render(wrap(<PatientSetPin />))
    // Header back button is the first button on screen.
    fireEvent.click(screen.getAllByRole("button")[0])
    expect(navigateMock).toHaveBeenCalledWith(-1)
  })
})
