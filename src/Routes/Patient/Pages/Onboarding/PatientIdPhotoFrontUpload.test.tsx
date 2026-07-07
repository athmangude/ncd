import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import { PatientIdPhotoFrontUpload } from "./PatientIdPhotoFrontUpload"

// ── Mocks ──────────────────────────────────────────────────────────────────

// SmileID is a heavy capture widget; stub it so the screen renders in jsdom.
vi.mock("@/components/SmileIDWrapper", () => ({
  SmileIDWrapper: () => createElement("div", { "data-testid": "smile-id" }),
}))

vi.mock("../../hooks/useNextKYCStep", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../hooks/useNextKYCStep")>()
  return { ...actual, default: () => "/patients/id-selfie" }
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
      { initialEntries: ["/patients/id-photo-front-upload"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientIdPhotoFrontUpload content-header migration", () => {
  it("renders the page title as the single content-header h1", () => {
    render(wrap(<PatientIdPhotoFrontUpload />))

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Add a photo of your National ID card",
    })
    expect(heading).toBeInTheDocument()
  })

  it("shows the title exactly once (no duplicate app-bar + content title)", () => {
    render(wrap(<PatientIdPhotoFrontUpload />))

    expect(
      screen.getAllByText("Add a photo of your National ID card")
    ).toHaveLength(1)
  })

  it("renders the description in the header", () => {
    render(wrap(<PatientIdPhotoFrontUpload />))

    expect(
      screen.getByText(
        /capture a clear photo of the front of your National ID/i
      )
    ).toBeInTheDocument()
  })
})
