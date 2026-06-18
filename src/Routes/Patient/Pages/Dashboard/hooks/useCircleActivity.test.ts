import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useCircleActivity } from "./useCircleActivity"
import { createElement, type ReactNode } from "react"

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

describe("useCircleActivity", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("fetches the circle-activity endpoint and exposes events", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          events: [
            {
              id: "e1",
              eventType: "MEMBER_JOINED",
              occurredAt: "2026-05-20T00:00:00Z",
              member: {
                id: "p1",
                firstName: "Brian",
                lastName: "K",
                avatarUrl: null,
              },
              stillQualifiesForBorrowing: true,
            },
          ],
        }),
      }),
    )

    const { result } = renderHook(() => useCircleActivity(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.events).toHaveLength(1)
    expect(result.current.events[0].eventType).toBe("MEMBER_JOINED")
    expect(result.current.events[0].member.firstName).toBe("Brian")
  })

  it("surfaces an empty events array when the endpoint errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "boom",
      }),
    )

    const { result } = renderHook(() => useCircleActivity(), {
      wrapper: makeWrapper(),
    })
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.events).toEqual([])
  })
})
