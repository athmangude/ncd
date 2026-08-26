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
    year: 2026,
    categories: [
      {
        category: "MEDICATION",
        totalSpend: "39176",
        percentage: 83,
        transactionCount: 20,
      },
      {
        category: "LAB_TEST",
        totalSpend: "4720",
        percentage: 10,
        transactionCount: 3,
      },
    ],
    monthlyTrend: [
      { month: 1, spend: "4260" },
      { month: 2, spend: "5640" },
    ],
    pagination: { total: 8, limit: 12, offset: 0 },
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useCostBreakdown", () => {
  let useCostBreakdown: typeof import("./useCostBreakdown").useCostBreakdown
  let costBreakdownQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useCostBreakdown")
    useCostBreakdown = mod.useCostBreakdown
    costBreakdownQueryKey = mod.costBreakdownQueryKey
  })

  it("exports the correct query key", () => {
    expect(costBreakdownQueryKey).toBe("careCompanionCostBreakdown")
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostBreakdown())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionCostBreakdown",
    ])
  })

  it("sets a 5-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostBreakdown())
    expect(capturedQueryOptions.staleTime).toBe(5 * 60 * 1000)
  })

  it("queryFn calls the cost-breakdown endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostBreakdown())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/care-companion/cost-breakdown")
    )
  })

  it("queryFn returns response.data with CostBreakdownResponse shape", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostBreakdown())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      categories: unknown[]
      monthlyTrend: unknown[]
      year: number
    }

    expect(result.year).toBe(2026)
    expect(result.categories).toHaveLength(2)
    expect(result.monthlyTrend).toHaveLength(2)
  })
})
