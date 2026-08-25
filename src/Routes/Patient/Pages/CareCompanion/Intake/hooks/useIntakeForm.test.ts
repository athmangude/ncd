import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import {
  getNextStepIndex,
  getPreviousStepIndex,
} from "./useIntakeForm"
import type {
  IntakeFormData,
  IntakeStep0Data,
  IntakeStep2Data,
  IntakeStep4Data,
} from "./useIntakeForm"

// ---------------------------------------------------------------------------
// Mock external dependencies so the hook can be imported in a pure-JS env.
// ---------------------------------------------------------------------------

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn().mockImplementation((opts) => ({
    mutate: vi.fn((args) => opts.mutationFn?.(args)),
    isPending: false,
    error: null,
  })),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: vi.fn(),
  }),
}))

vi.mock("axios", () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

vi.mock("./useCareCompanionProfile", () => ({
  careCompanionProfileQueryKey: "careCompanionProfile",
}))

// ---------------------------------------------------------------------------
// Pure function tests — getNextStepIndex / getPreviousStepIndex
// These are the core branching logic and can be tested without React.
// ---------------------------------------------------------------------------

function emptyFormData(
  overrides?: Partial<IntakeFormData>
): IntakeFormData {
  return {
    step0: null,
    step1: null,
    step2: null,
    step3: null,
    step4: null,
    step5: null,
    step6: null,
    ...overrides,
  }
}

describe("getNextStepIndex", () => {
  it("advances to next step by default", () => {
    expect(getNextStepIndex(0, emptyFormData())).toBe(1)
    expect(getNextStepIndex(1, emptyFormData())).toBe(2)
    expect(getNextStepIndex(3, emptyFormData())).toBe(4)
    expect(getNextStepIndex(5, emptyFormData())).toBe(6)
  })

  it("skips step 3 when takesMedication is false at step 2", () => {
    const formData = emptyFormData({
      step2: { takesMedication: false, medications: [] },
    })
    expect(getNextStepIndex(2, formData)).toBe(4)
  })

  it("goes to step 3 when takesMedication is true at step 2", () => {
    const formData = emptyFormData({
      step2: {
        takesMedication: true,
        medications: [{ name: "Metformin", dosage: "500mg", frequency: "daily" }],
      },
    })
    expect(getNextStepIndex(2, formData)).toBe(3)
  })

  it("goes to step 3 when step2 data is null (not yet filled)", () => {
    expect(getNextStepIndex(2, emptyFormData())).toBe(3)
  })

  it("skips step 5 when no pharmacy-related challenges at step 4", () => {
    const formData = emptyFormData({
      step4: { challenges: ["emotional-support"], otherChallenge: null },
    })
    expect(getNextStepIndex(4, formData)).toBe(6)
  })

  it("goes to step 5 when access-to-pharmacy challenge is selected", () => {
    const formData = emptyFormData({
      step4: { challenges: ["access-to-pharmacy"], otherChallenge: null },
    })
    expect(getNextStepIndex(4, formData)).toBe(5)
  })

  it("goes to step 5 when medication-cost challenge is selected", () => {
    const formData = emptyFormData({
      step4: { challenges: ["medication-cost"], otherChallenge: null },
    })
    expect(getNextStepIndex(4, formData)).toBe(5)
  })

  it("skips step 5 when step4 data is null (no challenges)", () => {
    expect(getNextStepIndex(4, emptyFormData())).toBe(6)
  })

  it("returns 7 (past total) at step 6", () => {
    expect(getNextStepIndex(6, emptyFormData())).toBe(7)
  })
})

describe("getPreviousStepIndex", () => {
  it("goes back by one step by default", () => {
    expect(getPreviousStepIndex(1, emptyFormData())).toBe(0)
    expect(getPreviousStepIndex(3, emptyFormData())).toBe(2)
    expect(getPreviousStepIndex(5, emptyFormData())).toBe(4)
  })

  it("jumps back from step 4 to step 2 when medication was no", () => {
    const formData = emptyFormData({
      step2: { takesMedication: false, medications: [] },
    })
    expect(getPreviousStepIndex(4, formData)).toBe(2)
  })

  it("goes back from step 4 to step 3 when medication was yes", () => {
    const formData = emptyFormData({
      step2: {
        takesMedication: true,
        medications: [{ name: "Metformin", dosage: "500mg", frequency: "daily" }],
      },
    })
    expect(getPreviousStepIndex(4, formData)).toBe(3)
  })

  it("jumps back from step 6 to step 4 when pharmacy step was skipped", () => {
    const formData = emptyFormData({
      step4: { challenges: ["emotional-support"], otherChallenge: null },
    })
    expect(getPreviousStepIndex(6, formData)).toBe(4)
  })

  it("goes back from step 6 to step 5 when pharmacy step was not skipped", () => {
    const formData = emptyFormData({
      step4: {
        challenges: ["access-to-pharmacy"],
        otherChallenge: null,
      },
    })
    expect(getPreviousStepIndex(6, formData)).toBe(5)
  })

  it("returns -1 at step 0", () => {
    expect(getPreviousStepIndex(0, emptyFormData())).toBe(-1)
  })
})

// ---------------------------------------------------------------------------
// Hook integration tests — useIntakeForm
// ---------------------------------------------------------------------------

describe("useIntakeForm", () => {
  // Must dynamically import after mocks are set up
  let useIntakeForm: typeof import("./useIntakeForm").useIntakeForm

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import("./useIntakeForm")
    useIntakeForm = mod.useIntakeForm
  })

  it("starts at step 0 with empty form data", () => {
    const { result } = renderHook(() => useIntakeForm())
    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.formData.step0).toBeNull()
    expect(result.current.isFirstStep).toBe(true)
    expect(result.current.totalSteps).toBe(7)
  })

  it("updateStepData updates the correct step", () => {
    const { result } = renderHook(() => useIntakeForm())
    const step0Data: IntakeStep0Data = { conditions: ["DIABETES"] }

    act(() => {
      result.current.updateStepData(0, step0Data)
    })

    expect(result.current.formData.step0).toEqual(step0Data)
    expect(result.current.formData.step1).toBeNull()
  })

  it("goForward advances step index", () => {
    const { result } = renderHook(() => useIntakeForm())

    act(() => {
      result.current.goForward()
    })

    expect(result.current.currentStepIndex).toBe(1)
    expect(result.current.isFirstStep).toBe(false)
  })

  it("goBack decrements step index", () => {
    const { result } = renderHook(() => useIntakeForm())

    act(() => {
      result.current.goForward()
      result.current.goForward()
    })
    expect(result.current.currentStepIndex).toBe(2)

    act(() => {
      result.current.goBack()
    })
    expect(result.current.currentStepIndex).toBe(1)
  })

  it("goBack does not go below 0", () => {
    const { result } = renderHook(() => useIntakeForm())

    act(() => {
      result.current.goBack()
    })

    expect(result.current.currentStepIndex).toBe(0)
  })

  it("goToStep jumps to a specific step", () => {
    const { result } = renderHook(() => useIntakeForm())

    act(() => {
      result.current.goToStep(4)
    })

    expect(result.current.currentStepIndex).toBe(4)
  })

  it("goToStep ignores out-of-bounds values", () => {
    const { result } = renderHook(() => useIntakeForm())

    act(() => {
      result.current.goToStep(10)
    })
    expect(result.current.currentStepIndex).toBe(0)

    act(() => {
      result.current.goToStep(-1)
    })
    expect(result.current.currentStepIndex).toBe(0)
  })

  it("goForward with step data uses fresh data for branching (stale closure fix)", () => {
    const { result } = renderHook(() => useIntakeForm())

    // Navigate to step 2
    act(() => {
      result.current.goToStep(2)
    })
    expect(result.current.currentStepIndex).toBe(2)

    // Simulate calling goForward with step data in same handler
    // This was the critical bug: without the fix, formData.step2 would be
    // stale (null) when goForward computes branching.
    const step2Data: IntakeStep2Data = {
      takesMedication: false,
      medications: [],
    }

    act(() => {
      result.current.goForward(step2Data, 2)
    })

    // Should skip to step 4, NOT step 3
    expect(result.current.currentStepIndex).toBe(4)
    expect(result.current.formData.step2).toEqual(step2Data)
  })

  it("goForward with medication data goes to step 3 (no skip)", () => {
    const { result } = renderHook(() => useIntakeForm())

    act(() => {
      result.current.goToStep(2)
    })

    const step2Data: IntakeStep2Data = {
      takesMedication: true,
      medications: [{ name: "Metformin", dosage: "500mg", frequency: "daily" }],
    }

    act(() => {
      result.current.goForward(step2Data, 2)
    })

    expect(result.current.currentStepIndex).toBe(3)
  })

  it("goForward with challenge data skips pharmacy step when no pharmacy challenges", () => {
    const { result } = renderHook(() => useIntakeForm())

    act(() => {
      result.current.goToStep(4)
    })

    const step4Data: IntakeStep4Data = {
      challenges: ["emotional-support"],
      otherChallenge: null,
    }

    act(() => {
      result.current.goForward(step4Data, 4)
    })

    // Should skip to step 6, not step 5
    expect(result.current.currentStepIndex).toBe(6)
  })

  it("does not go past the last step", () => {
    const { result } = renderHook(() => useIntakeForm())

    act(() => {
      result.current.goToStep(6)
    })

    act(() => {
      result.current.goForward()
    })

    expect(result.current.currentStepIndex).toBe(6)
  })

  it("isLastStep reflects branching correctly", () => {
    const { result } = renderHook(() => useIntakeForm())

    act(() => {
      result.current.goToStep(6)
    })

    expect(result.current.isLastStep).toBe(true)
  })

  it("complete forward/back journey with medication skip path", () => {
    const { result } = renderHook(() => useIntakeForm())

    // Step 0 -> 1
    act(() => {
      result.current.updateStepData(0, { conditions: ["DIABETES"] })
      result.current.goForward()
    })
    expect(result.current.currentStepIndex).toBe(1)

    // Step 1 -> 2
    act(() => {
      result.current.goForward()
    })
    expect(result.current.currentStepIndex).toBe(2)

    // Step 2 -> 4 (skip medication details)
    act(() => {
      result.current.goForward(
        { takesMedication: false, medications: [] },
        2
      )
    })
    expect(result.current.currentStepIndex).toBe(4)

    // Step 4 -> 6 (skip pharmacy)
    act(() => {
      result.current.goForward(
        { challenges: ["emotional-support"], otherChallenge: null },
        4
      )
    })
    expect(result.current.currentStepIndex).toBe(6)

    // Go back from 6 -> should jump to 4 (pharmacy was skipped)
    act(() => {
      result.current.goBack()
    })
    expect(result.current.currentStepIndex).toBe(4)

    // Go back from 4 -> should jump to 2 (medication was no)
    act(() => {
      result.current.goBack()
    })
    expect(result.current.currentStepIndex).toBe(2)
  })
})
