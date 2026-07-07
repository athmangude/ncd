import { describe, it, expect, vi, beforeAll, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { createElement, type ReactNode } from "react"
import PatientOnboardingSuccess from "./PatientOnboardingSuccess"

// ── Mocks ──────────────────────────────────────────────────────────────────

const { mockNavigate } = vi.hoisted(() => ({ mockNavigate: vi.fn() }))

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>()
  return { ...actual, useNavigate: () => mockNavigate }
})

const { checklistData } = vi.hoisted(() => ({
  checklistData: { value: { phoneNameMatch: { isMatch: true } } as unknown },
}))

vi.mock("../../hooks/useOnboardingChecklist", () => ({
  useOnboardingChecklist: () => ({
    data: checklistData.value,
    isLoading: false,
  }),
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
  checklistData.value = { phoneNameMatch: { isMatch: true } }
})

function wrap(ui: ReactNode) {
  return createElement(
    MemoryRouter,
    { initialEntries: ["/patients/onboarding-success"] },
    ui
  )
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("PatientOnboardingSuccess content-header migration", () => {
  it("renders the success title as the single content-header h1", () => {
    render(wrap(<PatientOnboardingSuccess />))

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Account Created",
    })
    expect(heading).toBeInTheDocument()
    expect(screen.getAllByText("Account Created")).toHaveLength(1)
  })

  it("shows the phone-match warning title + support box when the match failed", () => {
    checklistData.value = { phoneNameMatch: { isMatch: false } }
    render(wrap(<PatientOnboardingSuccess />))

    expect(
      screen.getByRole("heading", { level: 1, name: "Membership activated." })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /Call Jireh Support/i })
    ).toBeInTheDocument()
  })

  it("dashboard CTA navigates home from the footer", async () => {
    render(wrap(<PatientOnboardingSuccess />))

    await userEvent.click(
      screen.getByRole("button", { name: /Take me to my dashboard/i })
    )
    expect(mockNavigate).toHaveBeenCalledWith("/patients")
  })
})
