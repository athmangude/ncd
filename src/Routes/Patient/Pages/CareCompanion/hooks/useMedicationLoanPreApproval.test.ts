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
    preApprovalDetails: {
      maxAmount: "5500",
      medications: [
        { name: "Metformin 500mg", estimatedCost: "2400" },
        { name: "Amlodipine 5mg", estimatedCost: "1800" },
        { name: "Aspirin 75mg", estimatedCost: "900" },
      ],
      targetPharmacy: { id: 103, name: "City Chemist Mombasa" },
      reason:
        "Based on your 8-month purchase history and consistent Jireh Care Saver activity, you are pre-approved for a medication loan to cover your next refill cycle.",
      expiresAt: "2026-09-30T23:59:59Z",
    },
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

  it("queryFn returns pre-approval data matching MedicationLoanPreApproval shape", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationLoanPreApproval())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      isPreApproved: boolean
      preApprovalDetails: {
        maxAmount: string
        medications: { name: string; estimatedCost: string }[]
        targetPharmacy: { id: number; name: string }
        reason: string
        expiresAt: string
      } | null
    }

    expect(result.isPreApproved).toBe(true)
    expect(result.preApprovalDetails).not.toBeNull()
    expect(result.preApprovalDetails?.maxAmount).toBe("5500")
    expect(result.preApprovalDetails?.medications).toHaveLength(3)
    expect(result.preApprovalDetails?.targetPharmacy.name).toBe(
      "City Chemist Mombasa"
    )
  })
})
