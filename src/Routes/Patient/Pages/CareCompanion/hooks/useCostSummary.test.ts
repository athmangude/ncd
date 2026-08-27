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
    ytdSpend: "47200",
    monthlyAverage: "5900",
    cashbackEarned: "2360",
    netSpend: "44840",
    annualProjection: "70800",
    transactionCount: 24,
    currency: "KES",
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
      expect.stringContaining("/companion/cost-summary")
    )
  })

  it("queryFn returns response.data with CostSummary shape", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostSummary())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = await queryFn()

    expect(result).toHaveProperty("year", 2026)
    expect(result).toHaveProperty("ytdSpend", "47200")
    expect(result).toHaveProperty("currency", "KES")
    expect(result).toHaveProperty("transactionCount", 24)
  })
})
