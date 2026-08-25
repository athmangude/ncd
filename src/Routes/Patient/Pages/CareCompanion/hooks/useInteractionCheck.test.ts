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
    interactions: [
      {
        id: "int-1",
        medicationA: "Metformin",
        medicationB: "Aspirin",
        severity: "mild",
        description: "Minor interaction possible",
        recommendation: "Monitor blood glucose",
      },
    ],
    checkedAt: "2026-08-25T12:00:00Z",
    hasSevereInteractions: false,
  },
})

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
  },
}))

describe("useInteractionCheck", () => {
  let useInteractionCheck: typeof import("./useInteractionCheck").useInteractionCheck
  let interactionCheckQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    const mod = await import("./useInteractionCheck")
    useInteractionCheck = mod.useInteractionCheck
    interactionCheckQueryKey = mod.interactionCheckQueryKey
  })

  it("exports the correct query key", () => {
    expect(interactionCheckQueryKey).toBe(
      "careCompanionInteractionCheck"
    )
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useInteractionCheck())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionInteractionCheck",
    ])
  })

  it("sets a 10-minute staleTime (interactions change less frequently)", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useInteractionCheck())
    expect(capturedQueryOptions.staleTime).toBe(10 * 60 * 1000)
  })

  it("queryFn calls the interaction-check endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useInteractionCheck())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/care-companion/interaction-check")
    )
  })

  it("queryFn returns hasSevereInteractions flag", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useInteractionCheck())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as { hasSevereInteractions: boolean }

    expect(result.hasSevereInteractions).toBe(false)
  })
})
