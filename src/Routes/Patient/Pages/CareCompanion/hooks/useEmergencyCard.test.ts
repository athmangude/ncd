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
    id: "erc-diabetes-en",
    conditionType: "DIABETES",
    locale: "EN",
    title: "Diabetes Emergency Guide",
    warningSymptoms: [
      { symptom: "Shakiness, sweating, or sudden hunger (low blood sugar)", severity: "warning" },
      { symptom: "Fruity or acetone smell on breath (diabetic ketoacidosis)", severity: "critical" },
    ],
    immediateActions: [
      { step: 1, action: "Check blood sugar if a glucometer is available and note the reading" },
      { step: 2, action: "If blood sugar is below 4 mmol/L (70 mg/dL), give the person a sugary drink or glucose tablets immediately" },
    ],
    whenToGoToER: [
      "Blood sugar reading above 20 mmol/L (360 mg/dL) that does not come down",
      "The person is unconscious or having a seizure",
    ],
    doNotDo: [
      "Do not give insulin if you suspect low blood sugar (hypoglycaemia)",
      "Do not give food or drink to someone who is unconscious or having a seizure",
    ],
    version: 1,
    isPublished: true,
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
      expect.stringContaining("/companion/emergency-card")
    )
  })

  it("queryFn returns an EmergencyReferenceCard with condition-specific content", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEmergencyCard())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      id: string
      conditionType: string
      title: string
      warningSymptoms: { symptom: string; severity: string }[]
      immediateActions: { step: number; action: string }[]
      whenToGoToER: string[]
      doNotDo: string[]
    }

    expect(result.id).toBe("erc-diabetes-en")
    expect(result.conditionType).toBe("DIABETES")
    expect(result.title).toBe("Diabetes Emergency Guide")
    expect(result.warningSymptoms).toHaveLength(2)
    expect(result.immediateActions).toHaveLength(2)
    expect(result.whenToGoToER).toHaveLength(2)
    expect(result.doNotDo).toHaveLength(2)
  })
})
