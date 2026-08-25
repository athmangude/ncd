import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Track useMutation / useQuery options
// ---------------------------------------------------------------------------

const mockInvalidateQueries = vi.fn()
let capturedCreateOptions: Record<string, unknown> = {}
let capturedUpdateOptions: Record<string, unknown> = {}

let mutationCallCount = 0

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn().mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
  }),
  useMutation: vi.fn().mockImplementation((opts) => {
    mutationCallCount++
    // First call is createProfile, second is updateProfile
    if (mutationCallCount % 2 === 1) {
      capturedCreateOptions = opts
    } else {
      capturedUpdateOptions = opts
    }
    return {
      mutate: vi.fn(),
      isPending: false,
      error: null,
    }
  }),
  useQueryClient: vi.fn().mockReturnValue({
    invalidateQueries: mockInvalidateQueries,
  }),
}))

vi.mock("axios", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    patch: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

describe("useCareCompanionProfile", () => {
  let useCareCompanionProfile: typeof import("./useCareCompanionProfile").useCareCompanionProfile
  let careCompanionProfileQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    mutationCallCount = 0
    capturedCreateOptions = {}
    capturedUpdateOptions = {}
    const mod = await import("./useCareCompanionProfile")
    useCareCompanionProfile = mod.useCareCompanionProfile
    careCompanionProfileQueryKey = mod.careCompanionProfileQueryKey
  })

  it("exports a query key constant", () => {
    expect(careCompanionProfileQueryKey).toBe("careCompanionProfile")
  })

  it("returns query result plus create and update mutations", async () => {
    const { renderHook } = await import("@testing-library/react")
    const { result } = renderHook(() => useCareCompanionProfile())
    expect(result.current).toHaveProperty("createProfile")
    expect(result.current).toHaveProperty("updateProfile")
    expect(result.current).toHaveProperty("data")
  })

  it("createProfile onSuccess invalidates the profile query", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareCompanionProfile())

    // Simulate onSuccess callback from createProfile
    const onSuccess = capturedCreateOptions.onSuccess as () => void
    expect(onSuccess).toBeDefined()
    onSuccess()

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [careCompanionProfileQueryKey],
    })
  })

  it("updateProfile onSuccess invalidates the profile query", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useCareCompanionProfile())

    // Simulate onSuccess callback from updateProfile
    const onSuccess = capturedUpdateOptions.onSuccess as () => void
    expect(onSuccess).toBeDefined()
    onSuccess()

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [careCompanionProfileQueryKey],
    })
  })
})
