import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { createElement, type ReactNode } from "react"
import { MemoryRouter } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { startMockSession, endMockSession } from "@/mocks/auth/session"

vi.mock("@/hooks/useToast", () => ({ useToast: () => ({ toast: vi.fn() }) }))

vi.mock("../../stores/patientAuthStore", () => ({
  usePatientAuthStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({
      signUpDetails: { userId: "u1", firstName: "A", lastName: "B" },
      setUser: () => {},
    }),
}))

const getMock = vi.fn().mockResolvedValue({ data: { id: "login-1" } })
const postMock = vi.fn().mockResolvedValue({
  data: {
    data: {
      id: "p1",
      email: "",
      firstName: "A",
      lastName: "B",
      phoneNumber: "",
      isVerified: false,
    },
  },
})
vi.mock("axios", () => ({
  default: {
    get: (...a: unknown[]) => getMock(...a),
    post: (...a: unknown[]) => postMock(...a),
  },
}))

import PatientCreatePin from "./PatientCreatePin"

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

describe("PatientCreatePin (footer migration)", () => {
  beforeEach(() => {
    endMockSession()
    startMockSession()
    getMock.mockClear()
    postMock.mockClear()
  })

  it("renders a footer Submit button wired to submit the form", async () => {
    render(wrap(<PatientCreatePin />))
    const submit = await screen.findByRole("button", { name: "Submit" })
    expect(submit).toHaveAttribute("form", "create-pin-form")
    expect(submit).toHaveAttribute("type", "submit")
  })

  it("submits matching PINs via the footer button", async () => {
    render(wrap(<PatientCreatePin />))
    const submit = await screen.findByRole("button", { name: "Submit" })

    const inputs = screen.getAllByPlaceholderText("Enter a 4 digit pin")
    fireEvent.change(inputs[0], { target: { value: "1234" } })
    fireEvent.change(inputs[1], { target: { value: "1234" } })
    fireEvent.click(submit)

    await waitFor(() => expect(postMock).toHaveBeenCalled())
  })
})
