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
    monthlyTotal: 7500,
    previousMonthTotal: 6800,
    percentageChange: 10.29,
    currency: "KES",
    period: { start: "2026-08-01", end: "2026-08-31" },
    categories: [{ name: "Medication", amount: 5000, percentage: 66.7 }],
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useCostSummary", () => {
  let useCostSummary: typeof import("./useCostSummary").useCostSummary
  let costSummaryQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useCostSummary")
    useCostSummary = mod.useCostSummary
    costSummaryQueryKey = mod.costSummaryQueryKey
  })

  it("exports the correct query key", () => {
    expect(costSummaryQueryKey).toBe("careCompanionCostSummary")
  })

  it("returns query result shape", async () => {
    const { renderHook } = await import("@testing-library/react")
    const { result } = renderHook(() => useCostSummary())
    expect(result.current).toHaveProperty("data")
    expect(result.current).toHaveProperty("isLoading")
    expect(result.current).toHaveProperty("error")
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostSummary())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionCostSummary",
    ])
  })

  it("sets a 5-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostSummary())
    expect(capturedQueryOptions.staleTime).toBe(5 * 60 * 1000)
  })

  it("queryFn calls the cost-summary endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostSummary())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/care-companion/cost-summary")
    )
  })

  it("queryFn returns response.data", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostSummary())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = await queryFn()

    expect(result).toHaveProperty("monthlyTotal", 7500)
    expect(result).toHaveProperty("currency", "KES")
  })
})
