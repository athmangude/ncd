import { useMutation } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import axios from "axios"
import { useCareCompanionStore } from "../store/careCompanionStore"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  metadata?: {
    interactionCheckTriggered?: boolean
    medicationsReferenced?: string[]
  }
}

interface SendMessagePayload {
  message: string
  sessionId: string | null
}

interface SendMessageResponse {
  sessionId: string
  reply: string
  metadata?: {
    interactionCheckTriggered?: boolean
    medicationsReferenced?: string[]
  }
}

interface MutationContext {
  previousMessages: ChatMessage[]
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const activeAiSessionId = useCareCompanionStore(
    (state) => state.activeAiSessionId
  )
  const setActiveAiSessionId = useCareCompanionStore(
    (state) => state.setActiveAiSessionId
  )

  const { mutate: sendMessageMutate, isPending, error } = useMutation({
    mutationFn: async (payload: SendMessagePayload) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/care-companion/assistant/chat`,
        {
          message: payload.message,
          sessionId: payload.sessionId,
        }
      )
      return response.data as SendMessageResponse
    },
    onMutate: (variables): MutationContext => {
      const previousMessages = [...messages]
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: variables.message,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMessage])
      return { previousMessages }
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        setActiveAiSessionId(data.sessionId)
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toISOString(),
        metadata: data.metadata,
      }
      setMessages((prev) => [...prev, assistantMessage])
    },
    onError: (_error, _variables, context) => {
      if (context?.previousMessages) {
        setMessages(context.previousMessages)
      }
    },
  })

  const send = useCallback(
    (message: string) => {
      sendMessageMutate({
        message,
        sessionId: activeAiSessionId,
      })
    },
    [sendMessageMutate, activeAiSessionId]
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setActiveAiSessionId(null)
  }, [setActiveAiSessionId])

  return {
    messages,
    send,
    clearMessages,
    isSending: isPending,
    error,
  }
}
