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
    availableCredit: 2000,
    currency: "KES",
    isEligible: true,
    maxCreditLimit: 5000,
    usedCredit: 3000,
    nearestFacility: {
      id: "fac-1",
      name: "Kenyatta National Hospital",
      distanceKm: 3.2,
      estimatedTransportCost: 500,
    },
    lastUsedAt: "2026-07-15T10:00:00Z",
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useEmergencyTransportCredit", () => {
  let useEmergencyTransportCredit: typeof import("./useEmergencyTransportCredit").useEmergencyTransportCredit
  let emergencyTransportCreditQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useEmergencyTransportCredit")
    useEmergencyTransportCredit = mod.useEmergencyTransportCredit
    emergencyTransportCreditQueryKey = mod.emergencyTransportCreditQueryKey
  })

  it("exports the correct query key", () => {
    expect(emergencyTransportCreditQueryKey).toBe(
      "careCompanionEmergencyTransportCredit"
    )
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEmergencyTransportCredit())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionEmergencyTransportCredit",
    ])
  })

  it("sets a 10-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEmergencyTransportCredit())
    expect(capturedQueryOptions.staleTime).toBe(10 * 60 * 1000)
  })

  it("queryFn calls the emergency-transport-credit endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEmergencyTransportCredit())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/care-companion/emergency-transport-credit")
    )
  })

  it("queryFn returns credit data with eligibility", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEmergencyTransportCredit())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      availableCredit: number
      isEligible: boolean
      nearestFacility: { name: string } | null
    }

    expect(result.availableCredit).toBe(2000)
    expect(result.isEligible).toBe(true)
    expect(result.nearestFacility?.name).toBe("Kenyatta National Hospital")
  })
})
