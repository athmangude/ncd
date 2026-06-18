import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useSendInviteReminders } from "./useSendInviteReminders"
import { createElement, type ReactNode } from "react"

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
}

describe("useSendInviteReminders", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("POSTs to the endpoint and returns the server response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ sent: 2, throttled: false }),
      }),
    )

    const { result } = renderHook(() => useSendInviteReminders(), {
      wrapper: makeWrapper(),
    })
    const value = await result.current.mutateAsync()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(value).toEqual({ sent: 2, throttled: false })
  })

  it("throws on non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "boom",
      }),
    )

    const { result } = renderHook(() => useSendInviteReminders(), {
      wrapper: makeWrapper(),
    })

    await expect(result.current.mutateAsync()).rejects.toThrow(/boom|500/)
  })
})
