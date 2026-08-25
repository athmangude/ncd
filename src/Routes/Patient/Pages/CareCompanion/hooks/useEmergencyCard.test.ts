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
    patientName: "Jane Wanjiku",
    conditions: ["DIABETES", "HYPERTENSION"],
    allergies: ["Penicillin"],
    bloodType: "O+",
    currentMedications: [
      { name: "Metformin", dosage: "500mg" },
      { name: "Amlodipine", dosage: "5mg" },
    ],
    emergencyContacts: [
      {
        id: "contact-1",
        name: "John Wanjiku",
        phone: "+254712345678",
        relationship: "Spouse",
      },
    ],
    insuranceProvider: "NHIF",
    insurancePolicyNumber: "12345678",
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useEmergencyCard", () => {
  let useEmergencyCard: typeof import("./useEmergencyCard").useEmergencyCard
  let emergencyCardQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useEmergencyCard")
    useEmergencyCard = mod.useEmergencyCard
    emergencyCardQueryKey = mod.emergencyCardQueryKey
  })

  it("exports the correct query key", () => {
    expect(emergencyCardQueryKey).toBe("careCompanionEmergencyCard")
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEmergencyCard())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionEmergencyCard",
    ])
  })

  it("sets a 15-minute staleTime (emergency data changes infrequently)", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEmergencyCard())
    expect(capturedQueryOptions.staleTime).toBe(15 * 60 * 1000)
  })

  it("queryFn calls the emergency-card endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEmergencyCard())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/care-companion/emergency-card")
    )
  })

  it("queryFn returns patient emergency info including contacts", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEmergencyCard())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      patientName: string
      conditions: string[]
      emergencyContacts: unknown[]
    }

    expect(result.patientName).toBe("Jane Wanjiku")
    expect(result.conditions).toContain("DIABETES")
    expect(result.emergencyContacts).toHaveLength(1)
  })
})
