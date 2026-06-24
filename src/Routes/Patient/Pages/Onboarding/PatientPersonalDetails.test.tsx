import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import axios from "axios"
import { PatientPersonalDetails } from "./PatientPersonalDetails"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios")

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: {
    SIGNUP: {
      PERSONAL_DETAILS_VIEW: "personal_details_view",
      PERSONAL_DETAILS_SUBMIT: "personal_details_submit",
    },
  },
}))

vi.mock("../../hooks/useNextOnboardingStep", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../hooks/useNextOnboardingStep")>()
  return {
    ...actual,
    default: () => "/patients/create-pin",
  }
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
      { initialEntries: ["/patients/personal-details"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientPersonalDetails footer migration", () => {
  it("renders the primary CTA in the footer", () => {
    render(wrap(<PatientPersonalDetails />))

    expect(
      screen.getByRole("button", { name: /Submit personal details/i })
    ).toBeInTheDocument()
  })

  it("footer button submits the associated form", async () => {
    vi.mocked(axios.post).mockResolvedValue({ data: { ok: true } })

    render(wrap(<PatientPersonalDetails />))

    await userEvent.type(
      screen.getByPlaceholderText("Enter your first name"),
      "Jane"
    )
    await userEvent.type(
      screen.getByPlaceholderText("Enter your last name"),
      "Doe"
    )
    await userEvent.click(
      screen.getByRole("button", { name: /Submit personal details/i })
    )

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("/patients/verify-phone-name-match"),
        {
          matchFields: {
            first_name: "Jane",
            last_name: "Doe",
            other_name: "",
            id_number: "",
          },
        }
      )
    })
  })
})
