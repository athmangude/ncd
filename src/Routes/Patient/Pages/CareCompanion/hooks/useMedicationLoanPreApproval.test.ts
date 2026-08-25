import { describe, it, expect, vi, beforeEach } from "vitest"

let capturedQueryOptions: Record<string, unknown> = {}

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn().mockImplementation((opts) => {
    capturedQueryOptions = opts
    return {
      data: undefined,
      isLoading: false,
      error: null,
    }
  }),
}))

const mockAxiosGet = vi.fn().mockResolvedValue({
  data: {
    isPreApproved: true,
    maxLoanAmount: 25000,
    currency: "KES",
    interestRate: 0.05,
    repaymentPeriodDays: 30,
    eligibilityFactors: [
      {
        factor: "Circle membership",
        status: "met",
        description: "Active in at least one circle",
      },
      {
        factor: "Care Saver balance",
        status: "partial",
        description: "Minimum balance requirement partially met",
      },
    ],
    estimatedMonthlyRepayment: 26250,
    medicationsCovered: [
      {
        medicationId: "med-1",
        medicationName: "Metformin",
        estimatedCost: 1500,
      },
    ],
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useMedicationLoanPreApproval", () => {
  let useMedicationLoanPreApproval: typeof import("./useMedicationLoanPreApproval").useMedicationLoanPreApproval
  let medicationLoanPreApprovalQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useMedicationLoanPreApproval")
    useMedicationLoanPreApproval = mod.useMedicationLoanPreApproval
    medicationLoanPreApprovalQueryKey = mod.medicationLoanPreApprovalQueryKey
  })

  it("exports the correct query key", () => {
    expect(medicationLoanPreApprovalQueryKey).toBe(
      "careCompanionMedicationLoanPreApproval"
    )
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationLoanPreApproval())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionMedicationLoanPreApproval",
    ])
  })

  it("sets a 15-minute staleTime (pre-approval changes infrequently)", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationLoanPreApproval())
    expect(capturedQueryOptions.staleTime).toBe(15 * 60 * 1000)
  })

  it("queryFn calls the medication-loan-pre-approval endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationLoanPreApproval())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining(
        "/care-companion/medication-loan-pre-approval"
      )
    )
  })

  it("queryFn returns pre-approval data with financial details", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationLoanPreApproval())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      isPreApproved: boolean
      maxLoanAmount: number
      eligibilityFactors: unknown[]
      medicationsCovered: unknown[]
    }

    expect(result.isPreApproved).toBe(true)
    expect(result.maxLoanAmount).toBe(25000)
    expect(result.eligibilityFactors).toHaveLength(2)
    expect(result.medicationsCovered).toHaveLength(1)
  })
})
