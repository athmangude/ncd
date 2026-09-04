import { useState, useCallback, useEffect } from "react"
import { useIntakeProfile } from "./useIntakeProfile"
import { supabase } from "@/lib/supabase"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

interface ChatSession {
  id: string
  messages: ChatMessage[]
  startedAt: string
  lastMessageAt: string
}

const STORAGE_KEY = "jireh:assistant-chat"

function loadChatSession(): ChatSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ChatSession
  } catch {
    return null
  }
}

function saveChatSession(session: ChatSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    // localStorage full or unavailable
  }
}

function clearChatStorage(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function useAssistantChat() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = loadChatSession()
    return saved?.messages ?? []
  })
  const [sessionId] = useState<string>(() => {
    const saved = loadChatSession()
    return saved?.id ?? crypto.randomUUID()
  })
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { data: profile } = useIntakeProfile()

  useEffect(() => {
    if (messages.length === 0) {
      clearChatStorage()
      return
    }
    saveChatSession({
      id: sessionId,
      messages,
      startedAt: messages[0].timestamp,
      lastMessageAt: messages[messages.length - 1].timestamp,
    })
  }, [messages, sessionId])

  const send = useCallback(
    async (message: string) => {
      if (isSending) return
      setError(null)
      setIsSending(true)

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, userMsg])

      try {
        const conversationHistory = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))
        const { data, error: fnError } = await supabase.functions.invoke(
          "chat-assistant",
          { body: { message, conversationHistory } },
        )
        if (fnError) throw fnError
        const replyText: string = data.reply

        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: replyText,
          timestamp: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to send"),
        )
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
      } finally {
        setIsSending(false)
      }
    },
    [isSending, messages, profile],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    clearChatStorage()
  }, [])

  return {
    messages,
    send,
    clearMessages,
    isSending,
    error,
  }
}
