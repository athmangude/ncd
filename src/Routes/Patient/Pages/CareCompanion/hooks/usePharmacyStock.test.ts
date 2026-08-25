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
    pharmacies: [
      {
        pharmacyId: "pharm-1",
        pharmacyName: "MedPlus Pharmacy",
        distanceKm: 1.5,
        items: [
          {
            medicationName: "Metformin",
            dosage: "500mg",
            inStock: true,
            price: 50,
            currency: "KES",
            lastCheckedAt: "2026-08-25T10:00:00Z",
          },
          {
            medicationName: "Amlodipine",
            dosage: "5mg",
            inStock: false,
            price: null,
            currency: "KES",
            lastCheckedAt: "2026-08-25T10:00:00Z",
          },
        ],
      },
    ],
    checkedAt: "2026-08-25T10:00:00Z",
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("usePharmacyStock", () => {
  let usePharmacyStock: typeof import("./usePharmacyStock").usePharmacyStock
  let pharmacyStockQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./usePharmacyStock")
    usePharmacyStock = mod.usePharmacyStock
    pharmacyStockQueryKey = mod.pharmacyStockQueryKey
  })

  it("exports the correct query key", () => {
    expect(pharmacyStockQueryKey).toBe("careCompanionPharmacyStock")
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => usePharmacyStock())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionPharmacyStock",
    ])
  })

  it("sets a 10-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => usePharmacyStock())
    expect(capturedQueryOptions.staleTime).toBe(10 * 60 * 1000)
  })

  it("queryFn calls the pharmacy-stock endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => usePharmacyStock())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/care-companion/pharmacy-stock")
    )
  })

  it("queryFn returns pharmacies with stock items", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => usePharmacyStock())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      pharmacies: { items: unknown[] }[]
    }

    expect(result.pharmacies).toHaveLength(1)
    expect(result.pharmacies[0].items).toHaveLength(2)
  })
})
