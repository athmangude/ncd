import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

// ---------------------------------------------------------------------------
// Track mutation options so we can invoke onMutate / onSuccess / onError
// manually in tests.
// ---------------------------------------------------------------------------

let capturedMutationOptions: Record<string, unknown> = {}
const mockMutate = vi.fn()

vi.mock("@tanstack/react-query", () => ({
  useMutation: vi.fn().mockImplementation((opts) => {
    capturedMutationOptions = opts
    return {
      mutate: mockMutate.mockImplementation((payload) => {
        opts.onMutate?.(payload)
      }),
      isPending: false,
      error: null,
    }
  }),
}))

const mockSetActiveAiSessionId = vi.fn()
vi.mock("../store/careCompanionStore", () => ({
  useCareCompanionStore: vi.fn().mockImplementation((selector) => {
    const state = {
      activeAiSessionId: null,
      setActiveAiSessionId: mockSetActiveAiSessionId,
    }
    return selector(state)
  }),
}))

vi.mock("axios", () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

// Stub crypto.randomUUID for deterministic tests
let uuidCounter = 0
vi.stubGlobal("crypto", {
  randomUUID: () => `test-uuid-${++uuidCounter}`,
})

describe("useAssistantChat", () => {
  let useAssistantChat: typeof import("./useAssistantChat").useAssistantChat

  beforeEach(async () => {
    vi.clearAllMocks()
    uuidCounter = 0
    mockMutate.mockImplementation((payload) => {
      const onMutate = capturedMutationOptions.onMutate as
        | ((variables: unknown) => unknown)
        | undefined
      onMutate?.(payload)
    })
    const mod = await import("./useAssistantChat")
    useAssistantChat = mod.useAssistantChat
  })

  it("starts with empty messages", () => {
    const { result } = renderHook(() => useAssistantChat())
    expect(result.current.messages).toEqual([])
    expect(result.current.isSending).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it("optimistically appends user message on send", () => {
    const { result } = renderHook(() => useAssistantChat())

    act(() => {
      result.current.send("Hello")
    })

    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0].role).toBe("user")
    expect(result.current.messages[0].content).toBe("Hello")
    expect(result.current.messages[0].id).toBe("test-uuid-1")
  })

  it("uses crypto.randomUUID for unique message IDs", () => {
    const { result } = renderHook(() => useAssistantChat())

    act(() => {
      result.current.send("First")
    })
    act(() => {
      result.current.send("Second")
    })

    const ids = result.current.messages.map((m) => m.id)
    expect(ids[0]).not.toBe(ids[1])
  })

  it("appends assistant message on success", () => {
    const { result } = renderHook(() => useAssistantChat())

    act(() => {
      result.current.send("Hello")
    })
    expect(result.current.messages).toHaveLength(1)

    // Simulate onSuccess
    act(() => {
      const onSuccess = capturedMutationOptions.onSuccess as (
        data: { sessionId: string; reply: string; metadata?: unknown }
      ) => void
      onSuccess({
        sessionId: "session-1",
        reply: "Hi there",
      })
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[1].role).toBe("assistant")
    expect(result.current.messages[1].content).toBe("Hi there")
  })

  it("sets active AI session ID on success", () => {
    const { result } = renderHook(() => useAssistantChat())

    act(() => {
      result.current.send("Hello")
    })

    act(() => {
      const onSuccess = capturedMutationOptions.onSuccess as (
        data: { sessionId: string; reply: string }
      ) => void
      onSuccess({ sessionId: "session-abc", reply: "Reply" })
    })

    expect(mockSetActiveAiSessionId).toHaveBeenCalledWith("session-abc")
  })

  it("rolls back optimistic user message on error", () => {
    const { result } = renderHook(() => useAssistantChat())

    // Capture the context returned from onMutate
    let mutationContext: { previousMessages: unknown[] } | undefined
    mockMutate.mockImplementation((payload) => {
      const onMutate = capturedMutationOptions.onMutate as (
        variables: unknown
      ) => { previousMessages: unknown[] }
      mutationContext = onMutate(payload)
    })

    act(() => {
      result.current.send("Failing message")
    })

    expect(result.current.messages).toHaveLength(1)
    expect(mutationContext).toBeDefined()
    expect(mutationContext?.previousMessages).toHaveLength(0)

    // Simulate onError — should restore previous (empty) messages
    act(() => {
      const onError = capturedMutationOptions.onError as (
        error: Error,
        variables: unknown,
        context: { previousMessages: unknown[] } | undefined
      ) => void
      onError(new Error("Network error"), {}, mutationContext)
    })

    expect(result.current.messages).toHaveLength(0)
  })

  it("clearMessages resets messages and session ID", () => {
    const { result } = renderHook(() => useAssistantChat())

    act(() => {
      result.current.send("Hello")
    })
    expect(result.current.messages).toHaveLength(1)

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toHaveLength(0)
    expect(mockSetActiveAiSessionId).toHaveBeenCalledWith(null)
  })

  it("preserves existing messages on error rollback", () => {
    const { result } = renderHook(() => useAssistantChat())

    // Send first message successfully
    mockMutate.mockImplementationOnce((payload) => {
      const onMutate = capturedMutationOptions.onMutate as (
        variables: unknown
      ) => { previousMessages: unknown[] }
      onMutate(payload)
    })

    act(() => {
      result.current.send("First")
    })

    act(() => {
      const onSuccess = capturedMutationOptions.onSuccess as (
        data: { sessionId: string; reply: string }
      ) => void
      onSuccess({ sessionId: "s1", reply: "First reply" })
    })

    expect(result.current.messages).toHaveLength(2)

    // Send second message and fail
    let secondContext: { previousMessages: unknown[] } | undefined
    mockMutate.mockImplementationOnce((payload) => {
      const onMutate = capturedMutationOptions.onMutate as (
        variables: unknown
      ) => { previousMessages: unknown[] }
      secondContext = onMutate(payload)
    })

    act(() => {
      result.current.send("Second")
    })

    // Should now have 3 messages (2 from first round + optimistic)
    expect(result.current.messages).toHaveLength(3)
    // The context should have 2 previous messages
    expect(secondContext?.previousMessages).toHaveLength(2)

    // Error rolls back to 2 messages
    act(() => {
      const onError = capturedMutationOptions.onError as (
        error: Error,
        variables: unknown,
        context: { previousMessages: unknown[] } | undefined
      ) => void
      onError(new Error("timeout"), {}, secondContext)
    })

    expect(result.current.messages).toHaveLength(2)
  })
})
