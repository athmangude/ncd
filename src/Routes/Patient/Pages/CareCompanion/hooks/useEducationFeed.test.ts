import { describe, it, expect, vi, beforeEach } from "vitest"

// ---------------------------------------------------------------------------
// Track both useQuery and useMutation options to verify query config and
// mutation onSuccess cache invalidation.
// ---------------------------------------------------------------------------

const mockInvalidateQueries = vi.fn()
let capturedQueryOptions: Record<string, unknown> = {}
let capturedMutationOptions: Record<string, unknown> = {}

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn().mockImplementation((opts) => {
    capturedQueryOptions = opts
    return {
      data: undefined,
      isLoading: false,
      error: null,
    }
  }),
  useMutation: vi.fn().mockImplementation((opts) => {
    capturedMutationOptions = opts
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

const mockAxiosGet = vi.fn().mockResolvedValue({
  data: {
    cards: [
      {
        id: "edu-dietary-001",
        conditionType: "DIABETES",
        contentType: "DIETARY",
        locale: "EN",
        title: "Ugali portions that work for blood sugar control",
        body: "You do not have to stop eating ugali.",
        weekNumber: 1,
        imageUrl: null,
        isPublished: true,
        householdCompatible: true,
        costNeutral: true,
        viewed: false,
      },
    ],
  },
})

const mockAxiosPost = vi.fn().mockResolvedValue({ data: {} })

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
    post: (...args: unknown[]) => mockAxiosPost(...args),
  },
}))

describe("useEducationFeed", () => {
  let useEducationFeed: typeof import("./useEducationFeed").useEducationFeed
  let educationFeedQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    capturedMutationOptions = {}
    const mod = await import("./useEducationFeed")
    useEducationFeed = mod.useEducationFeed
    educationFeedQueryKey = mod.educationFeedQueryKey
  })

  it("exports the correct query key", () => {
    expect(educationFeedQueryKey).toBe("careCompanionEducationFeed")
  })

  it("returns query result plus markViewed mutation", async () => {
    const { renderHook } = await import("@testing-library/react")
    const { result } = renderHook(() => useEducationFeed())
    expect(result.current).toHaveProperty("data")
    expect(result.current).toHaveProperty("isLoading")
    expect(result.current).toHaveProperty("markViewed")
  })

  it("configures useQuery with the correct queryKey", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEducationFeed())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionEducationFeed",
    ])
  })

  it("sets a 5-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEducationFeed())
    expect(capturedQueryOptions.staleTime).toBe(5 * 60 * 1000)
  })

  it("queryFn calls the education-cards endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEducationFeed())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/companion/education-cards")
    )
  })

  it("queryFn returns cards array", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEducationFeed())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as {
      cards: unknown[]
    }

    expect(result.cards).toHaveLength(1)
    expect(result.cards[0]).toHaveProperty("viewed", false)
    expect(result.cards[0]).toHaveProperty("contentType", "DIETARY")
  })

  it("markViewed mutationFn posts to the correct card-specific endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEducationFeed())

    const mutationFn = capturedMutationOptions.mutationFn as (
      cardId: string
    ) => Promise<unknown>
    await mutationFn("edu-dietary-001")

    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.stringContaining(
        "/companion/education-feed/edu-dietary-001/viewed"
      )
    )
  })

  it("markViewed onSuccess invalidates the education feed query cache", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useEducationFeed())

    const onSuccess = capturedMutationOptions.onSuccess as () => void
    expect(onSuccess).toBeDefined()
    onSuccess()

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [educationFeedQueryKey],
    })
  })
})
