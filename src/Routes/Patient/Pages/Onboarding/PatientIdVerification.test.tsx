import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import axios from "axios"
import { PatientIdVerification } from "./PatientIdVerification"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

vi.mock("../../hooks/useNextKYCStep", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../hooks/useNextKYCStep")>()
  return { ...actual, default: () => "/patients/document-verification" }
})

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (
    sel: (s: { user: Record<string, unknown> }) => unknown
  ) => sel({ user: {} }),
}))

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

afterEach(() => {
  vi.clearAllMocks()
})

function wrap(ui: ReactNode) {
  return createElement(
    QueryClientProvider,
    {
      client: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    },
    createElement(
      MemoryRouter,
      { initialEntries: ["/patients/id-verification"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientIdVerification footer migration", () => {
  it("renders the Submit CTA disabled until an ID is entered", async () => {
    render(wrap(<PatientIdVerification />))

    const submit = screen.getByRole("button", { name: "Submit" })
    expect(submit).toBeDisabled()

    await userEvent.type(screen.getByPlaceholderText("12345678"), "12345678")
    expect(submit).toBeEnabled()
  })

  it("footer button submits the associated form", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { ok: true } })

    render(wrap(<PatientIdVerification />))

    await userEvent.type(screen.getByPlaceholderText("12345678"), "12345678")
    await userEvent.click(screen.getByRole("button", { name: "Submit" }))

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/patients/verify-id-number"),
        { idNumber: "12345678" }
      )
    })
  })
})
