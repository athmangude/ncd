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
    entries: [
      {
        id: "entry-1",
        medicationName: "Metformin",
        dosage: "500mg",
        scheduledAt: "2026-08-25T08:00:00Z",
        takenAt: "2026-08-25T08:15:00Z",
        status: "taken",
        notes: null,
      },
    ],
    total: 50,
    limit: 10,
    offset: 0,
    hasMore: true,
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useMedicationTimeline", () => {
  let useMedicationTimeline: typeof import("./useMedicationTimeline").useMedicationTimeline
  let medicationTimelineQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useMedicationTimeline")
    useMedicationTimeline = mod.useMedicationTimeline
    medicationTimelineQueryKey = mod.medicationTimelineQueryKey
  })

  it("exports the correct query key", () => {
    expect(medicationTimelineQueryKey).toBe(
      "careCompanionMedicationTimeline"
    )
  })

  it("includes limit and offset in the queryKey for cache isolation", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationTimeline({ limit: 10, offset: 0 }))
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionMedicationTimeline",
      10,
      0,
    ])
  })

  it("uses different queryKeys for different offsets", async () => {
    const { renderHook } = await import("@testing-library/react")

    renderHook(() => useMedicationTimeline({ limit: 10, offset: 0 }))
    const firstKey = capturedQueryOptions.queryKey

    renderHook(() => useMedicationTimeline({ limit: 10, offset: 20 }))
    const secondKey = capturedQueryOptions.queryKey

    expect(firstKey).not.toEqual(secondKey)
  })

  it("sets a 2-minute staleTime (shorter than other hooks for live timeline data)", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationTimeline({ limit: 10, offset: 0 }))
    expect(capturedQueryOptions.staleTime).toBe(2 * 60 * 1000)
  })

  it("queryFn calls the medication-timeline endpoint with params", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationTimeline({ limit: 15, offset: 30 }))

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/care-companion/medication-timeline"),
      { params: { limit: 15, offset: 30 } }
    )
  })

  it("queryFn returns response.data with pagination fields", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationTimeline({ limit: 10, offset: 0 }))

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      entries: unknown[]
      total: number
      hasMore: boolean
    }

    expect(result.entries).toHaveLength(1)
    expect(result.total).toBe(50)
    expect(result.hasMore).toBe(true)
  })
})
