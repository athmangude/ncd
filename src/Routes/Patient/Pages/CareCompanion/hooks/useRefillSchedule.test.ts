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
    refills: [
      {
        id: "refill-1",
        medicationName: "Metformin",
        dosage: "500mg",
        dueDate: "2026-09-01",
        daysUntilDue: 7,
        estimatedCost: 1500,
        currency: "KES",
        pharmacyName: "MedPlus Pharmacy",
        pharmacyId: "pharm-1",
        status: "upcoming",
      },
      {
        id: "refill-2",
        medicationName: "Amlodipine",
        dosage: "5mg",
        dueDate: "2026-08-26",
        daysUntilDue: 1,
        estimatedCost: 800,
        currency: "KES",
        pharmacyName: null,
        pharmacyId: null,
        status: "due-soon",
      },
    ],
    totalEstimatedCost: 2300,
    currency: "KES",
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useRefillSchedule", () => {
  let useRefillSchedule: typeof import("./useRefillSchedule").useRefillSchedule
  let refillScheduleQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useRefillSchedule")
    useRefillSchedule = mod.useRefillSchedule
    refillScheduleQueryKey = mod.refillScheduleQueryKey
  })

  it("exports the correct query key", () => {
    expect(refillScheduleQueryKey).toBe("careCompanionRefillSchedule")
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useRefillSchedule())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionRefillSchedule",
    ])
  })

  it("sets a 5-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useRefillSchedule())
    expect(capturedQueryOptions.staleTime).toBe(5 * 60 * 1000)
  })

  it("queryFn calls the refill-schedule endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useRefillSchedule())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/care-companion/refill-schedule")
    )
  })

  it("queryFn returns response.data with refills and total cost", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useRefillSchedule())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      refills: unknown[]
      totalEstimatedCost: number
    }

    expect(result.refills).toHaveLength(2)
    expect(result.totalEstimatedCost).toBe(2300)
  })
})
