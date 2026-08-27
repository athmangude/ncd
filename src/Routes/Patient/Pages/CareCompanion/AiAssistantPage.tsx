import { useEffect, useRef, useState } from "react"
import {
  Sparkles,
  SendHorizontal,
  Trash2,
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { trackEvent } from "@/analytics/tracking"
import { EVENTS } from "@/analytics/events"
import { useAssistantChat } from "./hooks/useAssistantChat"
import { useSuggestedPrompts } from "./hooks/useSuggestedPrompts"
import type { ChatMessage } from "./hooks/useAssistantChat"

function formatTime(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    parts.push(
      <strong key={match.index} className="font-semibold">
        {match[1]}
      </strong>,
    )
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (/^[-*]\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} className="my-1.5 ml-4 list-disc space-y-0.5">
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""))
        i++
      }
      elements.push(
        <ol
          key={`ol-${i}`}
          className="my-1.5 ml-4 list-decimal space-y-0.5"
        >
          {items.map((item, idx) => (
            <li key={idx}>{renderInlineMarkdown(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    if (line.trim() === "") {
      elements.push(<div key={`br-${i}`} className="h-2" />)
    } else {
      elements.push(
        <p key={`p-${i}`}>{renderInlineMarkdown(line)}</p>,
      )
    }
    i++
  }

  return <div className="space-y-1">{elements}</div>
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md bg-card border",
        )}
      >
        <div className="text-sm leading-relaxed">
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
        <p
          className={cn(
            "mt-1 text-[10px]",
            isUser
              ? "text-primary-foreground/70"
              : "text-muted-foreground",
          )}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  )
}

function SuggestedPrompts({
  prompts,
  isLoading,
  onSelect,
}: {
  prompts: string[]
  isLoading: boolean
  onSelect: (prompt: string) => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <div className="text-center">
        <h3 className="text-sm font-semibold text-foreground">
          How can I help you today?
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Ask me about your medications, diet, or health questions.
        </p>
      </div>
      <div className="mt-2 flex w-full flex-col gap-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Personalizing questions for you...
            </span>
          </div>
        ) : (
          prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSelect(prompt)}
              className="rounded-xl border bg-card px-4 py-3 text-left text-sm text-foreground transition-colors active:bg-muted/50"
            >
              {prompt}
            </button>
          ))
        )}
      </div>
    </div>
  )
}

function GuardrailDisclaimer({
  dismissed,
  onDismiss,
}: {
  dismissed: boolean
  onDismiss: () => void
}) {
  if (dismissed) {
    return (
      <div className="flex items-center gap-1.5 px-1 py-1">
        <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
        <p className="text-[11px] text-amber-700">
          For general health info only — always consult your doctor.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 rounded-md bg-warning px-3 py-2.5">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
      <p className="flex-1 text-xs leading-relaxed text-amber-800">
        This assistant provides general health information based on
        your medication profile. It does not replace professional
        medical advice. Always consult your doctor or pharmacist.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-0.5 shrink-0 rounded p-0.5 text-amber-700 transition-colors active:bg-amber-200/50"
        aria-label="Dismiss disclaimer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function AiAssistantPage() {
  const { messages, send, clearMessages, isSending, error } =
    useAssistantChat()
  const {
    data: suggestedPrompts = [],
    isLoading: isLoadingPrompts,
  } = useSuggestedPrompts()
  const [input, setInput] = useState("")
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(
    () => sessionStorage.getItem("jireh:assistant-disclaimer") === "1",
  )
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDismissDisclaimer() {
    setDisclaimerDismissed(true)
    sessionStorage.setItem("jireh:assistant-disclaimer", "1")
  }

  useEffect(() => {
    trackEvent(EVENTS.CARE_COMPANION.AI_ASSISTANT.VIEW)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isSending) return

    trackEvent(EVENTS.CARE_COMPANION.AI_ASSISTANT.MESSAGE_SEND, {
      messageLength: trimmed.length,
    })
    send(trimmed)
    setInput("")
  }

  function handleChipTap(prompt: string) {
    trackEvent(EVENTS.CARE_COMPANION.AI_ASSISTANT.SUGGESTED_ACTION_TAP, {
      prompt,
    })
    send(prompt)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-base font-semibold text-foreground">
            Care Assistant
          </h1>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearMessages}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors active:bg-muted/50"
            aria-label="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Guardrail disclaimer */}
      <div className="px-4 pt-3">
        <GuardrailDisclaimer
          dismissed={disclaimerDismissed}
          onDismiss={handleDismissDisclaimer}
        />
      </div>

      {/* Messages area */}
      {messages.length === 0 ? (
        <SuggestedPrompts
          prompts={suggestedPrompts}
          isLoading={isLoadingPrompts}
          onSelect={handleChipTap}
        />
      ) : (
        <div className="flex-1 overflow-y-auto px-4 py-3">
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md border bg-card px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">
                    Something went wrong. Please try again.
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t bg-background px-4 py-3 pb-[calc(0.75rem+var(--safe-area-inset-bottom,0px))]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your medications..."
            disabled={isSending}
            className={cn(
              "flex-1 rounded-xl border bg-muted/30 px-4 py-2.5 text-sm text-foreground",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/30",
              "disabled:opacity-50",
            )}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              "bg-primary text-primary-foreground",
              "transition-colors active:bg-primary/90",
              "disabled:opacity-40",
            )}
            aria-label="Send message"
          >
            <SendHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
