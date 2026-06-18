import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const navigateMock = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  )
  return { ...actual, useNavigate: () => navigateMock }
})

const toastMock = vi.fn()
vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: toastMock }),
}))

vi.mock("axios", () => ({
  default: { post: vi.fn().mockResolvedValue({ data: { success: true } }) },
}))

import PatientChangePin from "./PatientChangePin"

const wrap = (ui: ReactNode) =>
  createElement(
    QueryClientProvider,
    { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) },
    createElement(
      MemoryRouter,
      { initialEntries: ["/patients/change-pin"] },
      ui
    )
  )

// The OTP component renders a single hidden text input we can type into.
const typePin = (value: string) => {
  const input = document.querySelector(
    "input[autocomplete]"
  ) as HTMLInputElement | null
  const target = input ?? (document.querySelector("input") as HTMLInputElement)
  fireEvent.change(target, { target: { value } })
}

describe("PatientChangePin (MobileWrapper migration)", () => {
  beforeEach(() => {
    navigateMock.mockClear()
    toastMock.mockClear()
  })

  it("renders the header title and step-1 footer actions", () => {
    render(wrap(<PatientChangePin />))
    expect(screen.getByText("Change PIN")).toBeInTheDocument()
    expect(screen.getByText("Enter your current PIN")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument()
  })

  it("disables Continue until the old PIN is 4 digits", () => {
    render(wrap(<PatientChangePin />))
    const cont = screen.getByRole("button", { name: "Continue" })
    expect(cont).toBeDisabled()
    typePin("1234")
    expect(cont).not.toBeDisabled()
  })

  it("Cancel navigates to security-and-permissions", () => {
    render(wrap(<PatientChangePin />))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(navigateMock).toHaveBeenCalledWith(
      "/patients/security-and-permissions"
    )
  })

  it("advances to step 2 (Save PIN) after a valid old PIN", () => {
    render(wrap(<PatientChangePin />))
    typePin("1234")
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    expect(screen.getByText("Create your new PIN")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Save PIN" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument()
  })

  it("Back from step 2 returns to step 1", () => {
    render(wrap(<PatientChangePin />))
    typePin("1234")
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(screen.getByText("Enter your current PIN")).toBeInTheDocument()
  })

  it("rejects a new PIN identical to the old PIN", () => {
    render(wrap(<PatientChangePin />))
    typePin("1234")
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    typePin("1234")
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }))
    expect(
      screen.getByText(/New PIN must be different from old PIN/i)
    ).toBeInTheDocument()
  })

  it("reaches the confirm step and shows the Confirm action", () => {
    render(wrap(<PatientChangePin />))
    typePin("1234")
    fireEvent.click(screen.getByRole("button", { name: "Continue" }))
    typePin("5678")
    fireEvent.click(screen.getByRole("button", { name: "Save PIN" }))
    expect(screen.getByText("Confirm your new PIN")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })

  it("header back from step 1 exits to security-and-permissions", () => {
    render(wrap(<PatientChangePin />))
    // Header back button is the first button rendered.
    fireEvent.click(screen.getAllByRole("button")[0])
    expect(navigateMock).toHaveBeenCalledWith(
      "/patients/security-and-permissions"
    )
  })
})
