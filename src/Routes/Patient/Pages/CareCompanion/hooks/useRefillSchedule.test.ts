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
    schedules: [
      {
        id: "refill-metformin-grace",
        medicationName: "Metformin 500mg",
        expectedRefillDate: "2026-08-28",
        status: "DUE",
        daysUntilRefill: 3,
        estimatedDaysSupply: 30,
        escalatedToLoanOffer: false,
      },
      {
        id: "refill-aspirin-grace",
        medicationName: "Aspirin 75mg",
        expectedRefillDate: "2026-08-20",
        status: "OVERDUE",
        daysUntilRefill: -5,
        estimatedDaysSupply: 30,
        escalatedToLoanOffer: true,
      },
    ],
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
      expect.stringContaining("/companion/refill-schedule")
    )
  })

  it("queryFn returns response.data with schedules array", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useRefillSchedule())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      schedules: unknown[]
    }

    expect(result.schedules).toHaveLength(2)
    expect(result.schedules[0]).toMatchObject({
      id: "refill-metformin-grace",
      medicationName: "Metformin 500mg",
      status: "DUE",
      daysUntilRefill: 3,
    })
  })
})
