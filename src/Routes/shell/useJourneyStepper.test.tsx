// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useJourneyStepper, useJourneyStepMeta } from "./useJourneyStepper"
import { LOAN_APPLICATION_STEPS } from "@/Routes/Patient/hooks/useNextLoanApplicationStep"
import { CARE_PROFILE_STEPS } from "@/Routes/Patient/hooks/useNextCareProfileStep"
import { KYC_STEPS } from "@/Routes/Patient/hooks/useNextKYCStep"
import { ONBOARDING_STEPS } from "@/Routes/Patient/hooks/useNextOnboardingStep"
import { PWA_STEPS } from "@/Routes/Patient/hooks/useNextPWAOnboardingStep"
import { FAST_TRACK_STEPS } from "@/Routes/Patient/hooks/useNextFastTrackStep"
import { CIRCLE_INVITE_SMS_STEPS } from "@/Routes/Patient/hooks/useNextCircleInviteStep"

// ── Mocks ──────────────────────────────────────────────────────────────────

let mockPathname = "/patients/notifications"

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom")
  return {
    ...actual,
    useLocation: () => ({ pathname: mockPathname, state: {} }),
  }
})

vi.mock("@/Routes/Patient/stores/patientAuthStore", () => ({
  usePatientAuthStore: (
    sel: (s: { user: Record<string, unknown> }) => unknown
  ) => sel({ user: {} }),
}))

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

// ── Tests ──────────────────────────────────────────────────────────────────

describe("useJourneyStepper", () => {
  it("returns null on a non-journey path", () => {
    mockPathname = "/patients/notifications"
    const { result } = renderHook(() => useJourneyStepper())
    expect(result.current).toBeNull()
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
    // Circle invite always reports a 4-step journey.
    { name: "circle invite", path: CIRCLE_INVITE_SMS_STEPS[0], total: 4 },
  ]

  journeys.forEach(({ name, path, total }) => {
    it(`detects the ${name} journey at step 1 of ${total} on its first route`, () => {
      mockPathname = path
      const { result } = renderHook(() => useJourneyStepper())
      expect(result.current).not.toBeNull()
      expect(result.current?.currentStep).toBe(1)
      expect(result.current?.totalSteps).toBe(total)
    })
  })
})

describe("useJourneyStepMeta", () => {
  it("returns {} for a route with no labelled step config", () => {
    mockPathname = "/patients/notifications"
    const { result } = renderHook(() => useJourneyStepMeta())
    expect(result.current).toEqual({})
  })

  it("returns the step label as the title for a config-backed route", () => {
    // KYC step 1 is the National ID number step.
    mockPathname = KYC_STEPS[0]
    const { result } = renderHook(() => useJourneyStepMeta())
    expect(result.current.title).toBe("National ID number")
  })
})
