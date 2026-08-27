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
        date: "2026-08-05",
        medicationName: "Metformin 500mg",
        dosage: "500mg",
        quantity: 60,
        lineTotal: "480",
        facilityName: "Mombasa Hospital Pharmacy",
        gapDaysFromPrevious: 30,
        isGapAnomaly: false,
      },
    ],
    summary: {
      totalMedications: 3,
      pharmaciesUsed: 2,
      dateRange: { from: "2025-12-18", to: "2026-08-05" },
    },
    pagination: { total: 24, limit: 20, offset: 0 },
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

  it("includes limit, offset, and medicationId in the queryKey for cache isolation", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationTimeline({ limit: 20, offset: 0 }))
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionMedicationTimeline",
      20,
      0,
      null,
    ])
  })

  it("includes medicationId in queryKey when provided", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() =>
      useMedicationTimeline({ limit: 20, offset: 0, medicationId: "Metformin" })
    )
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionMedicationTimeline",
      20,
      0,
      "Metformin",
    ])
  })

  it("uses different queryKeys for different offsets", async () => {
    const { renderHook } = await import("@testing-library/react")

    renderHook(() => useMedicationTimeline({ limit: 20, offset: 0 }))
    const firstKey = capturedQueryOptions.queryKey

    renderHook(() => useMedicationTimeline({ limit: 20, offset: 20 }))
    const secondKey = capturedQueryOptions.queryKey

    expect(firstKey).not.toEqual(secondKey)
  })

  it("sets a 2-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationTimeline({ limit: 20, offset: 0 }))
    expect(capturedQueryOptions.staleTime).toBe(2 * 60 * 1000)
  })

  it("queryFn calls the medication-timeline endpoint with limit and offset params", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationTimeline({ limit: 15, offset: 30 }))

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/companion/medication-timeline"),
      { params: { limit: 15, offset: 30 } }
    )
  })

  it("queryFn passes medicationId param when provided", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() =>
      useMedicationTimeline({ limit: 20, offset: 0, medicationId: "Aspirin" })
    )

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/companion/medication-timeline"),
      { params: { limit: 20, offset: 0, medicationId: "Aspirin" } }
    )
  })

  it("queryFn returns response.data with entries, summary, and pagination", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationTimeline({ limit: 20, offset: 0 }))

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      entries: unknown[]
      summary: { totalMedications: number; pharmaciesUsed: number }
      pagination: { total: number; limit: number; offset: number }
    }

    expect(result.entries).toHaveLength(1)
    expect(result.summary.totalMedications).toBe(3)
    expect(result.summary.pharmaciesUsed).toBe(2)
    expect(result.pagination.total).toBe(24)
  })
})
