import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import StepperHeader from "./StepperHeader"
import { LOAN_APPLICATION_STEPS } from "@/Routes/Patient/hooks/useNextLoanApplicationStep"
import { CARE_PROFILE_STEPS } from "@/Routes/Patient/hooks/useNextCareProfileStep"
import { KYC_STEPS } from "@/Routes/Patient/hooks/useNextKYCStep"
import { ONBOARDING_STEPS } from "@/Routes/Patient/hooks/useNextOnboardingStep"
import { PWA_STEPS } from "@/Routes/Patient/hooks/useNextPWAOnboardingStep"
import { FAST_TRACK_STEPS } from "@/Routes/Patient/hooks/useNextFastTrackStep"
import { CIRCLE_INVITE_SMS_STEPS } from "@/Routes/Patient/hooks/useNextCircleInviteStep"

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

  const journeys: { name: string; path: string; total: number }[] = [
    {
      name: "loan application",
      path: LOAN_APPLICATION_STEPS[0],
      total: LOAN_APPLICATION_STEPS.length,
    },
    {
      name: "care profile",
      path: CARE_PROFILE_STEPS[0],
      total: CARE_PROFILE_STEPS.length,
    },
    { name: "kyc", path: KYC_STEPS[0], total: KYC_STEPS.length },
    {
      name: "onboarding",
      path: ONBOARDING_STEPS[0],
      total: ONBOARDING_STEPS.length,
    },
    { name: "pwa", path: PWA_STEPS[0], total: PWA_STEPS.length },
    {
      name: "fast track",
      path: FAST_TRACK_STEPS[0],
      total: FAST_TRACK_STEPS.length,
    },
    // Circle invite always renders a 4-step stepper.
    { name: "circle invite", path: CIRCLE_INVITE_SMS_STEPS[0], total: 4 },
  ]

  journeys.forEach(({ name, path, total }) => {
    it(`renders the ${name} stepper at step 1 of ${total} on its first route`, () => {
      mockPathname = path
      renderHeader()
      const stepper = screen.getByTestId("stepper")
      expect(stepper).toHaveAttribute("data-current", "1")
      expect(stepper).toHaveAttribute("data-total", String(total))
    })
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
