import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PWAOnboardingIntro from "./PWAOnboardingIntro"

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mockNavigate }
})

vi.mock("@/analytics", () => ({
  trackEvent: vi.fn(),
  EVENTS: { PWA_INSTALL: { ONBOARDING_INTRO_VIEW: "pwa_intro_view" } },
}))

// Keep PWA_STEP_CONFIG + getFirstIncompletePWAOnboardingStep, stub the status hook.
vi.mock("../../hooks/useNextPWAOnboardingStep", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../hooks/useNextPWAOnboardingStep")
    >()
  return {
    ...actual,
    usePWAOnboardingStatus: () => ({ stepStatus: {}, loading: false }),
  }
})

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
    MemoryRouter,
    { initialEntries: ["/patients/pwa-setup-intro"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PWAOnboardingIntro content-header migration", () => {
  it("renders the title as the single content-header h1", () => {
    render(wrap(<PWAOnboardingIntro />))

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Get the full experience",
    })
    expect(heading).toBeInTheDocument()
    expect(screen.getAllByText("Get the full experience")).toHaveLength(1)
  })

  it("keeps the 'Only takes 1min!' header action pill", () => {
    render(wrap(<PWAOnboardingIntro />))

    expect(screen.getByText(/Only takes 1min/i)).toBeInTheDocument()
  })

  it("renders the primary and secondary CTAs in the footer", () => {
    render(wrap(<PWAOnboardingIntro />))

    expect(
      screen.getByRole("button", { name: /Personalise my care/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Take me to my dashboard/i })
    ).toBeInTheDocument()
  })

  it("dashboard CTA navigates home", async () => {
    render(wrap(<PWAOnboardingIntro />))

    await userEvent.click(
      screen.getByRole("button", { name: /Take me to my dashboard/i })
    )
    expect(mockNavigate).toHaveBeenCalledWith("/patients")
  })
})
