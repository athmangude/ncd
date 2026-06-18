import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useCircleStatus } from "./useCircleStatus"
import { createElement, type ReactNode } from "react"

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

const member = {
  id: "p1",
  firstName: "Brian",
  lastName: "K",
  avatarUrl: null,
}

function stubFetch(networkBody: unknown, activityBody: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) => {
      if (url.includes("/circle-activity")) {
        return Promise.resolve({
          ok: true,
          json: async () => activityBody,
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => networkBody,
      })
    }),
  )
}

const emptySlots = {
  accountable: { used: 0, reserved: 0, max: 3 },
  auxiliary: { used: 0, reserved: 0, max: 2 },
}

describe("useCircleStatus banner priority", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("SET_UP_CIRCLE wins over every other banner when there are no confirmed members", async () => {
    stubFetch(
      {
        network: [],
        invites: [
          { id: "i1", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
        ],
        slots: emptySlots,
      },
      {
        events: [
          {
            id: "e1",
            eventType: "MEMBER_JOINED",
            occurredAt: new Date().toISOString(),
            member,
            stillQualifiesForBorrowing: true,
          },
          {
            id: "e2",
            eventType: "MEMBER_REMOVED",
            occurredAt: new Date().toISOString(),
            member,
            stillQualifiesForBorrowing: false,
          },
        ],
      },
    )
    const { result } = renderHook(() => useCircleStatus(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeBanner?.variant).toBe("SET_UP_CIRCLE")
  })

  it("MEMBER_LEFT wins over PENDING_INVITES and MEMBER_JOINED", async () => {
    stubFetch(
      {
        network: [{ id: "m1", firstName: "Existing", lastName: "M", profilePhoto: null }],
        invites: [
          { id: "i1", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
        ],
        slots: emptySlots,
      },
      {
        events: [
          {
            id: "e1",
            eventType: "MEMBER_REMOVED",
            occurredAt: new Date().toISOString(),
            member,
            stillQualifiesForBorrowing: false,
          },
          {
            id: "e2",
            eventType: "MEMBER_JOINED",
            occurredAt: new Date().toISOString(),
            member,
            stillQualifiesForBorrowing: true,
          },
        ],
      },
    )
    const { result } = renderHook(() => useCircleStatus(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeBanner?.variant).toBe("MEMBER_LEFT")
  })

  it("PENDING_INVITES wins over MEMBER_JOINED when no left event", async () => {
    stubFetch(
      {
        network: [{ id: "m1", firstName: "Existing", lastName: "M", profilePhoto: null }],
        invites: [
          { id: "i1", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
        ],
        slots: emptySlots,
      },
      {
        events: [
          {
            id: "e1",
            eventType: "MEMBER_JOINED",
            occurredAt: new Date().toISOString(),
            member,
            stillQualifiesForBorrowing: true,
          },
        ],
      },
    )
    const { result } = renderHook(() => useCircleStatus(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeBanner?.variant).toBe("PENDING_INVITES")
  })

  it("MEMBER_JOINED is selected when only a join event exists", async () => {
    stubFetch(
      {
        network: [{ id: "m1", firstName: "Existing", lastName: "M", profilePhoto: null }],
        invites: [],
        slots: emptySlots,
      },
      {
        events: [
          {
            id: "e1",
            eventType: "MEMBER_JOINED",
            occurredAt: new Date().toISOString(),
            member,
            stillQualifiesForBorrowing: true,
          },
        ],
      },
    )
    const { result } = renderHook(() => useCircleStatus(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeBanner?.variant).toBe("MEMBER_JOINED")
  })

  it("MEMBER_LEFT banner shows when removal event has no acknowledgedAt field (API omits it)", async () => {
    stubFetch(
      {
        network: [{ id: "m1", firstName: "Existing", lastName: "M", profilePhoto: null }],
        invites: [],
        slots: emptySlots,
      },
      {
        events: [
          {
            id: "e1",
            eventType: "MEMBER_REMOVED",
            occurredAt: new Date().toISOString(),
            member,
            stillQualifiesForBorrowing: false,
            // acknowledgedAt intentionally absent — matches real API response shape
          },
        ],
      },
    )
    const { result } = renderHook(() => useCircleStatus(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeBanner?.variant).toBe("MEMBER_LEFT")
  })

  it("returns null banner in neutral state", async () => {
    stubFetch(
      {
        network: [{ id: "m1", firstName: "Existing", lastName: "M", profilePhoto: null }],
        invites: [],
        slots: emptySlots,
      },
      { events: [] },
    )
    const { result } = renderHook(() => useCircleStatus(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeBanner).toBeNull()
  })

  it("ignores PENDING_INVITES when every invite is younger than 2h", async () => {
    stubFetch(
      {
        network: [{ id: "m1", firstName: "Existing", lastName: "M", profilePhoto: null }],
        invites: [
          { id: "i1", createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        ],
        slots: emptySlots,
      },
      { events: [] },
    )
    const { result } = renderHook(() => useCircleStatus(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.activeBanner).toBeNull()
  })
})
