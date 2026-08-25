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
    items: [
      {
        id: "item-1",
        medicationName: "Metformin",
        dosage: "500mg",
        unitCost: 50,
        quantity: 30,
        totalCost: 1500,
        currency: "KES",
        frequency: "daily",
        pharmacyName: "MedPlus",
      },
    ],
    grandTotal: 1500,
    currency: "KES",
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

  it("queryFn returns response.data with items and grandTotal", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCostBreakdown())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as { items: unknown[]; grandTotal: number }

    expect(result.items).toHaveLength(1)
    expect(result.grandTotal).toBe(1500)
  })
})
