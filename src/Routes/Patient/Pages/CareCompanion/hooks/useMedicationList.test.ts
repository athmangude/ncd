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
    medications: [
      {
        id: "med-1",
        name: "Metformin",
        genericName: "Metformin Hydrochloride",
        dosage: "500mg",
        frequency: "twice daily",
        route: "oral",
        prescribedBy: "Dr. Ochieng",
        startDate: "2025-01-15",
        endDate: null,
        isActive: true,
        refillDueDate: "2026-09-01",
        remainingQuantity: 14,
      },
    ],
    totalActive: 3,
    totalInactive: 1,
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useMedicationList", () => {
  let useMedicationList: typeof import("./useMedicationList").useMedicationList
  let medicationListQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useMedicationList")
    useMedicationList = mod.useMedicationList
    medicationListQueryKey = mod.medicationListQueryKey
  })

  it("exports the correct query key", () => {
    expect(medicationListQueryKey).toBe("careCompanionMedicationList")
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationList())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionMedicationList",
    ])
  })

  it("sets a 5-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationList())
    expect(capturedQueryOptions.staleTime).toBe(5 * 60 * 1000)
  })

  it("queryFn calls the medications endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationList())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/companion/medications")
    )
  })

  it("queryFn returns response.data with medication counts", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationList())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      medications: unknown[]
      totalActive: number
      totalInactive: number
    }

    expect(result.medications).toHaveLength(1)
    expect(result.totalActive).toBe(3)
    expect(result.totalInactive).toBe(1)
  })
})
