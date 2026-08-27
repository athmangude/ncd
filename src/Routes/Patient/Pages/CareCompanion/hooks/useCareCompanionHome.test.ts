import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Capture the options passed to useQuery so we can verify queryKey, queryFn,
// and staleTime without rendering a full QueryClient provider.
// ---------------------------------------------------------------------------

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
    refillSchedule: {
      schedules: [{ id: "r1", medicationName: "Metformin 500mg", status: "DUE", daysUntilRefill: 3 }],
      hasMore: false,
    },
    costSummary: {
      year: 2026,
      ytdSpend: "18000",
      monthlyAverage: "2571",
      cashbackEarned: "1260",
      netSpend: "16740",
      annualProjection: "30857",
      transactionCount: 24,
      currency: "KES",
    },
    educationFeed: null,
    emergencyCard: null,
    emergencyTransportCredit: null,
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useCareCompanionHome", () => {
  let useCareCompanionHome: typeof import("./useCareCompanionHome").useCareCompanionHome
  let careCompanionHomeQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useCareCompanionHome")
    useCareCompanionHome = mod.useCareCompanionHome
    careCompanionHomeQueryKey = mod.careCompanionHomeQueryKey
  })

  it("exports a query key constant", () => {
    expect(careCompanionHomeQueryKey).toBe("careCompanionHome")
  })

  it("returns query result shape", async () => {
    const { renderHook } = await import("@testing-library/react")
    const { result } = renderHook(() => useCareCompanionHome())
    expect(result.current).toHaveProperty("data")
    expect(result.current).toHaveProperty("isLoading")
    expect(result.current).toHaveProperty("error")
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareCompanionHome())
    expect(capturedQueryOptions.queryKey).toEqual(["careCompanionHome"])
  })

  it("sets a 5-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareCompanionHome())
    expect(capturedQueryOptions.staleTime).toBe(5 * 60 * 1000)
  })

  it("queryFn calls the correct API endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareCompanionHome())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/companion/home")
    )
  })

  it("queryFn returns response.data (unwraps axios envelope)", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareCompanionHome())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = await queryFn()

    expect(result).toHaveProperty("refillSchedule")
    expect(result).toHaveProperty("costSummary")
  })
})
