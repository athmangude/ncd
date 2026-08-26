import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CareCompanionEvent,
  CareCompanionProfile,
  LlmActionEvent,
} from "@/types/care-companion"
import { runPipeline } from "@/lib/ai-pipeline"

const EVENTS_QUERY_KEY = ["care-companion", "events"]

async function fetchEvents(): Promise<CareCompanionEvent[]> {
  const res = await fetch("/care-companion/events?limit=200")
  if (!res.ok) return []
  const json = await res.json()
  return json.data ?? json
}

async function postEventsBatch(
  events: CareCompanionEvent[],
): Promise<CareCompanionEvent[]> {
  const results: CareCompanionEvent[] = []
  for (const event of events) {
    const res = await fetch("/care-companion/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
    results.push(await res.json())
  }
  return results
}

async function updateEvent(
  event: CareCompanionEvent,
): Promise<CareCompanionEvent> {
  const res = await fetch(`/care-companion/events/${event.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
  })
  if (!res.ok) {
    const res2 = await fetch("/care-companion/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    })
    return res2.json()
  }
  return res.json()
}

export function useAiPipeline(profile: CareCompanionProfile | null) {
  const queryClient = useQueryClient()
  const hasRunRef = useRef(false)
  const isRunningRef = useRef(false)
  const [isPipelineRunning, setIsPipelineRunning] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(
    () => new Set(),
  )

  const { data: events = [] } = useQuery({
    queryKey: EVENTS_QUERY_KEY,
    queryFn: fetchEvents,
    staleTime: 30_000,
  })

  const saveBatchMutation = useMutation({
    mutationFn: postEventsBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY })
    },
  })

  const llmInsights = events
    .filter((e): e is LlmActionEvent => e.type === "LLM_ACTION")
    .filter((e) => !e.dismissed && !dismissedIds.has(e.id))
    .filter((e) => e.actionType !== "INVOICE_POPULATE")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const triggerPipeline = useCallback(async () => {
    if (!profile || isRunningRef.current) return
    isRunningRef.current = true
    setIsPipelineRunning(true)

    try {
      const cached =
        queryClient.getQueryData<CareCompanionEvent[]>(EVENTS_QUERY_KEY)
      const freshEvents =
        cached ?? (await queryClient.fetchQuery({
          queryKey: EVENTS_QUERY_KEY,
          queryFn: fetchEvents,
        }))

      const newActions = await runPipeline(profile, freshEvents)
      if (newActions.length === 0) return

      await saveBatchMutation.mutateAsync(newActions)
    } catch (err) {
      console.error("[useAiPipeline] Pipeline run failed:", err)
    } finally {
      isRunningRef.current = false
      setIsPipelineRunning(false)
    }
  }, [profile, queryClient, saveBatchMutation])

  useEffect(() => {
    if (!profile || hasRunRef.current) return
    hasRunRef.current = true
    triggerPipeline()
  }, [profile, triggerPipeline])

  const prevNonLlmCountRef = useRef(0)

  useEffect(() => {
    if (!profile || !hasRunRef.current) return
    const nonLlmCount = events.filter((e) => e.type !== "LLM_ACTION").length
    if (
      nonLlmCount > prevNonLlmCountRef.current &&
      prevNonLlmCountRef.current > 0
    ) {
      triggerPipeline()
    }
    prevNonLlmCountRef.current = nonLlmCount
  }, [events, profile, triggerPipeline])

  const dismissInsight = useCallback(
    (insightId: string) => {
      setDismissedIds((prev) => new Set(prev).add(insightId))
      const cached =
        queryClient.getQueryData<CareCompanionEvent[]>(EVENTS_QUERY_KEY)
      const insight = (cached ?? events).find(
        (e): e is LlmActionEvent =>
          e.type === "LLM_ACTION" && e.id === insightId,
      )
      if (insight) {
        updateEvent({ ...insight, dismissed: true }).then(() => {
          queryClient.invalidateQueries({ queryKey: EVENTS_QUERY_KEY })
        })
      }
    },
    [events, queryClient],
  )

  return {
    insights: llmInsights,
    isRunning: isPipelineRunning,
    triggerPipeline,
    dismissInsight,
  }
}
