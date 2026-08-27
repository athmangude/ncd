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

const mockAxiosGet = vi.fn().mockImplementation((url: string) => {
  if (url.includes("/companion/medication-cards")) {
    return Promise.resolve({
      data: {
        cards: [
          {
            card: {
              id: "mc-metformin-en",
              medicationId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
              locale: "EN",
              description: "Metformin description",
              howItWorks: "How metformin works",
              commonSideEffects: [],
              seriousSideEffects: [],
              avoidanceWarnings: [],
              whenToSeekHelp: "When to seek help",
              storageInstructions: "Store at room temp",
            },
            interactions: [
              {
                withMedication: "Bitter melon",
                severity: "MODERATE",
                description: "Combined blood sugar lowering effect",
                recommendation: "Monitor blood sugar more frequently",
              },
            ],
          },
          {
            card: {
              id: "mc-amlodipine-en",
              medicationId: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
              locale: "EN",
              description: "Amlodipine description",
              howItWorks: null,
              commonSideEffects: [],
              seriousSideEffects: [],
              avoidanceWarnings: [],
              whenToSeekHelp: "Contact doctor",
              storageInstructions: null,
            },
            interactions: [],
          },
        ],
        pagination: { total: 2, limit: 20, offset: 0 },
      },
    })
  }
  if (url.includes("/api/medications/taxonomy")) {
    return Promise.resolve({
      data: [
        {
          id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
          genericName: "Metformin",
          brandNames: ["Glucophage", "Dianben"],
          dosageForms: ["tablet"],
          strengths: ["500mg", "850mg"],
          category: "MEDICATION",
          atcCode: "A10BA02",
          synonyms: [],
          conditionTags: ["DIABETES"],
          isActive: true,
        },
        {
          id: "7c9e6679-7425-40de-944b-e07fc1f90ae7",
          genericName: "Amlodipine",
          brandNames: ["Norvasc"],
          dosageForms: ["tablet"],
          strengths: ["5mg", "10mg"],
          category: "MEDICATION",
          atcCode: "C08CA01",
          synonyms: [],
          conditionTags: ["HYPERTENSION"],
          isActive: true,
        },
      ],
    })
  }
  return Promise.resolve({ data: {} })
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

  it("queryFn calls both medication-cards and taxonomy endpoints", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationCards())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledTimes(2)
    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/companion/medication-cards"),
    )
    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/api/medications/taxonomy"),
    )
  })

  it("queryFn returns enriched cards with taxonomy data", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationCards())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<{
      cards: {
        genericName: string
        brandNames: string[]
        strengths: string[]
        conditionTags: string[]
        card: { id: string }
        interactions: { withMedication: string; severity: string }[]
      }[]
      pagination: { total: number }
    }>
    const result = await queryFn()

    expect(result.cards).toHaveLength(2)
    expect(result.pagination).toEqual({ total: 2, limit: 20, offset: 0 })

    const metformin = result.cards[0]
    expect(metformin.genericName).toBe("Metformin")
    expect(metformin.brandNames).toEqual(["Glucophage", "Dianben"])
    expect(metformin.strengths).toEqual(["500mg", "850mg"])
    expect(metformin.conditionTags).toEqual(["DIABETES"])
    expect(metformin.card.id).toBe("mc-metformin-en")
    expect(metformin.interactions).toHaveLength(1)
    expect(metformin.interactions[0].severity).toBe("MODERATE")

    const amlodipine = result.cards[1]
    expect(amlodipine.genericName).toBe("Amlodipine")
    expect(amlodipine.interactions).toHaveLength(0)
  })

  it("queryFn falls back gracefully when taxonomy entry is missing", async () => {
    mockAxiosGet.mockImplementation((url: string) => {
      if (url.includes("/companion/medication-cards")) {
        return Promise.resolve({
          data: {
            cards: [
              {
                card: {
                  id: "mc-unknown-en",
                  medicationId: "nonexistent-id",
                  locale: "EN",
                  description: "Unknown drug",
                  howItWorks: null,
                  commonSideEffects: [],
                  seriousSideEffects: [],
                  avoidanceWarnings: [],
                  whenToSeekHelp: "",
                  storageInstructions: null,
                },
                interactions: [],
              },
            ],
            pagination: { total: 1, limit: 20, offset: 0 },
          },
        })
      }
      if (url.includes("/api/medications/taxonomy")) {
        return Promise.resolve({ data: [] })
      }
      return Promise.resolve({ data: {} })
    })

    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMedicationCards())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<{
      cards: {
        genericName: string
        brandNames: string[]
        category: string
        strengths: string[]
        conditionTags: string[]
      }[]
    }>
    const result = await queryFn()

    expect(result.cards[0].genericName).toBe("Unknown")
    expect(result.cards[0].brandNames).toEqual([])
    expect(result.cards[0].category).toBe("MEDICATION")
    expect(result.cards[0].strengths).toEqual([])
    expect(result.cards[0].conditionTags).toEqual([])
  })
})
