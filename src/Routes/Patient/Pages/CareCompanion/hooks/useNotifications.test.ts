import { describe, it, expect, vi, beforeEach } from "vitest"
import type { CareCompanionNotification } from "@/types/care-companion"

// ---------------------------------------------------------------------------
// Track useQuery, useMutation, and useQueryClient options/calls to verify
// query config, optimistic update, rollback, and onSettled invalidation.
// ---------------------------------------------------------------------------

const mockInvalidateQueries = vi.fn()
const mockCancelQueries = vi.fn().mockResolvedValue(undefined)
const mockSetQueryData = vi.fn()
const mockSetQueriesData = vi.fn()
const mockGetQueriesData = vi.fn().mockReturnValue([])

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
    cancelQueries: mockCancelQueries,
    setQueryData: mockSetQueryData,
    setQueriesData: mockSetQueriesData,
    getQueriesData: mockGetQueriesData,
  }),
}))

const mockAxiosGet = vi.fn().mockResolvedValue({
  data: [
    {
      id: "notif-1",
      type: "REFILL_REMINDER",
      title: "Refill due soon",
      body: "Your Metformin refill is coming up.",
      deepLink: "/patients/care-companion/refill-schedule",
      scheduledAt: "2026-08-25T06:00:00Z",
      sentAt: "2026-08-25T06:00:00Z",
      readAt: null,
      metadata: null,
    },
  ] satisfies CareCompanionNotification[],
})

const mockAxiosPatch = vi.fn().mockResolvedValue({ data: {} })

vi.mock("axios", () => ({
  default: {
    get: (...args: unknown[]) => mockAxiosGet(...args),
    patch: (...args: unknown[]) => mockAxiosPatch(...args),
  },
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useNotifications", () => {
  let useNotifications: typeof import("./useNotifications").useNotifications
  let useMarkNotificationRead: typeof import("./useNotifications").useMarkNotificationRead
  let notificationsQueryKey: string

  beforeEach(async () => {
    vi.clearAllMocks()
    capturedQueryOptions = {}
    capturedMutationOptions = {}
    const mod = await import("./useNotifications")
    useNotifications = mod.useNotifications
    useMarkNotificationRead = mod.useMarkNotificationRead
    notificationsQueryKey = mod.notificationsQueryKey
  })

  // -------------------------------------------------------------------------
  // Query key export
  // -------------------------------------------------------------------------

  it("exports the correct query key", () => {
    expect(notificationsQueryKey).toBe("careCompanionNotifications")
  })

  // -------------------------------------------------------------------------
  // useNotifications — query config
  // -------------------------------------------------------------------------

  it("configures useQuery with the correct queryKey (default, no filter)", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useNotifications())
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionNotifications",
      { unreadOnly: undefined },
    ])
  })

  it("includes unreadOnly in the queryKey when provided", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useNotifications(true))
    expect(capturedQueryOptions.queryKey).toEqual([
      "careCompanionNotifications",
      { unreadOnly: true },
    ])
  })

  it("sets a 2-minute staleTime", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useNotifications())
    expect(capturedQueryOptions.staleTime).toBe(2 * 60 * 1000)
  })

  it("queryFn calls the notifications endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useNotifications())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/api/care-companion/notifications"),
      expect.objectContaining({ params: undefined })
    )
  })

  it("queryFn passes unreadOnly param when enabled", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useNotifications(true))

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    await queryFn()

    expect(mockAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("/api/care-companion/notifications"),
      expect.objectContaining({ params: { unreadOnly: true } })
    )
  })

  it("queryFn returns the response data array", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useNotifications())

    const queryFn = capturedQueryOptions.queryFn as () => Promise<unknown>
    const result = (await queryFn()) as CareCompanionNotification[]

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("notif-1")
  })

  // -------------------------------------------------------------------------
  // useMarkNotificationRead — mutation config
  // -------------------------------------------------------------------------

  it("mutationFn PATCHes the correct notification-specific endpoint", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMarkNotificationRead())

    const mutationFn = capturedMutationOptions.mutationFn as (
      id: string
    ) => Promise<unknown>
    await mutationFn("notif-42")

    expect(mockAxiosPatch).toHaveBeenCalledWith(
      expect.stringContaining(
        "/api/care-companion/notifications/notif-42/read"
      )
    )
  })

  // -------------------------------------------------------------------------
  // Optimistic update — onMutate
  // -------------------------------------------------------------------------

  it("onMutate cancels in-flight queries, snapshots all variants, and optimistically updates", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMarkNotificationRead())

    const existingData: [unknown[], CareCompanionNotification[]][] = [
      [
        ["careCompanionNotifications", { unreadOnly: undefined }],
        [
          {
            id: "notif-1",
            type: "REFILL_REMINDER",
            title: "Refill",
            body: "Body",
            deepLink: "/link",
            scheduledAt: "2026-08-25T06:00:00Z",
            sentAt: "2026-08-25T06:00:00Z",
            readAt: null,
            metadata: null,
          },
        ],
      ],
    ]
    mockGetQueriesData.mockReturnValue(existingData)

    const onMutate = capturedMutationOptions.onMutate as (
      id: string
    ) => Promise<{ previous: typeof existingData }>
    const context = await onMutate("notif-1")

    expect(mockCancelQueries).toHaveBeenCalledWith({
      queryKey: ["careCompanionNotifications"],
    })

    expect(mockGetQueriesData).toHaveBeenCalledWith({
      queryKey: ["careCompanionNotifications"],
    })

    expect(mockSetQueriesData).toHaveBeenCalledWith(
      { queryKey: ["careCompanionNotifications"] },
      expect.any(Function)
    )

    expect(context.previous).toBe(existingData)
  })

  // -------------------------------------------------------------------------
  // Rollback — onError
  // -------------------------------------------------------------------------

  it("onError restores every cached variant from the snapshot", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMarkNotificationRead())

    const defaultKey = [
      "careCompanionNotifications",
      { unreadOnly: undefined },
    ]
    const filteredKey = ["careCompanionNotifications", { unreadOnly: true }]
    const defaultData = [{ id: "notif-1", readAt: null }]
    const filteredData = [{ id: "notif-1", readAt: null }]

    const previous: [unknown[], unknown[]][] = [
      [defaultKey, defaultData],
      [filteredKey, filteredData],
    ]

    const onError = capturedMutationOptions.onError as (
      err: unknown,
      id: unknown,
      context: { previous: typeof previous } | undefined
    ) => void

    onError(new Error("network"), "notif-1", { previous })

    expect(mockSetQueryData).toHaveBeenCalledTimes(2)
    expect(mockSetQueryData).toHaveBeenCalledWith(defaultKey, defaultData)
    expect(mockSetQueryData).toHaveBeenCalledWith(filteredKey, filteredData)
  })

  it("onError is a no-op when context is undefined", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMarkNotificationRead())

    const onError = capturedMutationOptions.onError as (
      err: unknown,
      id: unknown,
      context: undefined
    ) => void

    onError(new Error("network"), "notif-1", undefined)

    expect(mockSetQueryData).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------------
  // Cache invalidation — onSettled
  // -------------------------------------------------------------------------

  it("onSettled invalidates the notifications query cache", async () => {
    const { renderHook } = await import("@testing-library/react")
    renderHook(() => useMarkNotificationRead())

    const onSettled = capturedMutationOptions.onSettled as () => void
    expect(onSettled).toBeDefined()
    onSettled()

    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ["careCompanionNotifications"],
    })
  })
})
