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
  data: [
    {
      facilityId: 101,
      facilityName: "Coast Chemist Mombasa",
      medicationName: "Metformin 500mg",
      status: "IN_STOCK",
      lastReportedAt: "2026-08-24T14:30:00Z",
      distance: 1.2,
      lat: -4.0435,
      lng: 39.6682,
    },
    {
      facilityId: 101,
      facilityName: "Coast Chemist Mombasa",
      medicationName: "Amlodipine 5mg",
      status: "IN_STOCK",
      lastReportedAt: "2026-08-24T14:30:00Z",
      distance: 1.2,
      lat: -4.0435,
      lng: 39.6682,
    },
    {
      facilityId: 102,
      facilityName: "Mombasa Medicare Pharmacy",
      medicationName: "Metformin 500mg",
      status: "LOW_STOCK",
      lastReportedAt: "2026-08-23T09:15:00Z",
      distance: 2.4,
      lat: -4.0512,
      lng: 39.6714,
    },
  ],
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
      expect.stringContaining("/care-companion/pharmacy-stock"),
    )
  })

  it("queryFn returns a flat array of stock items", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => usePharmacyStock())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as Array<{
      facilityId: number
      medicationName: string
    }>

    expect(result).toHaveLength(3)
    expect(result[0].facilityId).toBe(101)
    expect(result[0].medicationName).toBe("Metformin 500mg")
    expect(result[2].facilityId).toBe(102)
  })
})
