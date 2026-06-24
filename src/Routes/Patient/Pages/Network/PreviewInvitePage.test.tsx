import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PreviewInvitePage from "./PreviewInvitePage"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("axios", () => ({ default: { post: vi.fn() } }))

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (
    sel: (s: { user: { firstName: string; lastName: string } }) => unknown
  ) => sel({ user: { firstName: "Test", lastName: "User" } }),
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
  localStorage.clear()
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
      { initialEntries: ["/patients/network/preview-invite"] },
      ui
    )
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PreviewInvitePage footer migration", () => {
  it("renders the Change photo and Send invite actions in the footer", () => {
    render(wrap(<PreviewInvitePage />))

    expect(
      screen.getByRole("button", { name: /Change photo/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Send invite/i })
    ).toBeInTheDocument()
  })
})
