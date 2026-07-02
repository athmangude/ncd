import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import StepperHeader from "./StepperHeader"
import { LOAN_APPLICATION_STEPS } from "@/Routes/Patient/hooks/useNextLoanApplicationStep"

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
let mockPathname = "/patients/notifications"

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: mockPathname, state: {} }),
  }
})

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (
    sel: (s: { user: Record<string, unknown> }) => unknown
  ) => sel({ user: {} }),
}))

// Keep the real PWA step constants; only stub the async status hook so the
// component renders synchronously without a network call.
vi.mock(
  "@/Routes/Patient/hooks/useNextPWAOnboardingStep",
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import("@/Routes/Patient/hooks/useNextPWAOnboardingStep")
      >()
    return {
      ...actual,
      usePWAOnboardingStatus: () => ({ stepStatus: {}, loading: false }),
    }
  }
)

// Render the Stepper as an identifiable stub so the detection logic can be
// asserted by its props rather than by DOM structure.
vi.mock("@/components/Stepper", () => ({
  Stepper: ({
    currentStep,
    totalSteps,
  }: {
    currentStep: number
    totalSteps: number
  }) => (
    <div
      data-testid="stepper"
      data-current={currentStep}
      data-total={totalSteps}
    />
  ),
}))

function renderHeader(props = {}) {
  return render(
    <MemoryRouter>
      <StepperHeader title="A title" {...props} />
    </MemoryRouter>
  )
}

beforeEach(() => {
  mockNavigate.mockClear()
})

// ── Tests ──────────────────────────────────────────────────────────────────

describe("StepperHeader", () => {
  it("renders the title and a back button by default", () => {
    mockPathname = "/patients/notifications"
    renderHeader()
    expect(screen.getByText("A title")).toBeInTheDocument()
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  // Phase 7: the bar matches the canonical BackTitleHeader look so the title is
  // "enclosed on the bar" identically across every titled patient screen.
  it("encloses the title in the canonical bordered/blurred/sticky bar", () => {
    mockPathname = "/patients/notifications"
    renderHeader()
    const header = screen.getByRole("banner")
    expect(header.className).toContain("border-b")
    expect(header.className).toContain("backdrop-blur-md")
    expect(header.className).toContain("sticky")
  })

  it("renders the title as a text-base paragraph (not a capitalized heading)", () => {
    mockPathname = "/patients/notifications"
    renderHeader()
    const title = screen.getByText("A title")
    expect(title.tagName).toBe("P")
    expect(title.className).toContain("text-base")
    expect(title.className).not.toContain("capitalize")
  })

  it("defaults the back button to navigate(-1)", () => {
    mockPathname = "/patients/notifications"
    renderHeader()
    fireEvent.click(screen.getByLabelText("Go back"))
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it("calls a custom onBack instead of navigating", () => {
    mockPathname = "/patients/notifications"
    const onBack = vi.fn()
    renderHeader({ onBack })
    fireEvent.click(screen.getByLabelText("Go back"))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it("renders a custom backIcon inside the back button", () => {
    mockPathname = "/patients/notifications"
    renderHeader({ backIcon: <span data-testid="custom-back" /> })
    expect(screen.getByTestId("custom-back")).toBeInTheDocument()
  })

  it("hides the back button when isRoot", () => {
    mockPathname = "/patients/notifications"
    renderHeader({ isRoot: true })
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("renders no stepper on a non-journey path", () => {
    mockPathname = "/patients/notifications"
    renderHeader()
    expect(screen.queryByTestId("stepper")).not.toBeInTheDocument()
  })

  // The full 7-journey detection table lives in useJourneyStepper.test.ts. Here
  // we only smoke-test that the bar still wires the hook through to a stepper on
  // a journey route (legacy layout).
  it("renders the journey stepper in the bar on a journey route", () => {
    mockPathname = LOAN_APPLICATION_STEPS[0]
    renderHeader()
    const stepper = screen.getByTestId("stepper")
    expect(stepper).toHaveAttribute("data-current", "1")
    expect(stepper).toHaveAttribute(
      "data-total",
      String(LOAN_APPLICATION_STEPS.length)
    )
  })

  it("drops the border and suppresses the in-bar stepper for the slim variant", () => {
    mockPathname = LOAN_APPLICATION_STEPS[0]
    renderHeader({ border: false, showStepper: false })
    const header = screen.getByRole("banner")
    expect(header.className).not.toContain("border-b")
    expect(screen.queryByTestId("stepper")).not.toBeInTheDocument()
  })

  it("renders the help button and navigates on click when showHelp", async () => {
    mockPathname = "/patients/notifications"
    const { default: userEvent } = await import("@testing-library/user-event")
    renderHeader({ showHelp: true, isRoot: true })
    const helpButton = screen.getByRole("button", { name: /need help/i })
    await userEvent.click(helpButton)
    expect(mockNavigate).toHaveBeenCalledWith(
      "/patients/payment/request-payment/help"
    )
  })
})
