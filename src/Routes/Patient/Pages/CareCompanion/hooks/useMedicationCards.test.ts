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
    cards: [
      {
        id: "card-1",
        medicationName: "Metformin",
        dosage: "500mg",
        frequency: "twice daily",
        nextDoseAt: "2026-08-25T20:00:00Z",
        adherenceRate: 0.92,
        refillDueDate: "2026-09-01",
        daysUntilRefill: 7,
        monthlyCost: 1500,
        currency: "KES",
        status: "on-track",
      },
      {
        id: "card-2",
        medicationName: "Amlodipine",
        dosage: "5mg",
        frequency: "daily",
        nextDoseAt: null,
        adherenceRate: 0.45,
        refillDueDate: null,
        daysUntilRefill: null,
        monthlyCost: 800,
        currency: "KES",
        status: "critical",
      },
    ],
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useMedicationCards", () => {
  let useMedicationCards: typeof import("./useMedicationCards").useMedicationCards
  let medicationCardsQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useMedicationCards")
    useMedicationCards = mod.useMedicationCards
    medicationCardsQueryKey = mod.medicationCardsQueryKey
  })

  it("exports the correct query key", () => {
    expect(medicationCardsQueryKey).toBe("careCompanionMedicationCards")
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationCards())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionMedicationCards",
    ])
  })

  it("sets a 5-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationCards())
    expect(capturedQueryOptions.staleTime).toBe(5 * 60 * 1000)
  })

  it("queryFn calls the medication-cards endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationCards())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/care-companion/medication-cards")
    )
  })

  it("queryFn returns response.data with cards array", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationCards())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as { cards: unknown[] }

    expect(result.cards).toHaveLength(2)
  })
})
