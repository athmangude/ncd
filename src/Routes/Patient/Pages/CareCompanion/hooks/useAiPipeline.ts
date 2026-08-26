import { useCallback, useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CareCompanionEvent,
  CareCompanionNotification,
  CareCompanionProfile,
  LlmActionEvent,
} from "@/types/care-companion"
import { runPipeline } from "@/lib/ai-pipeline"

const EVENTS_QUERY_KEY = ["care-companion", "events"]
const NOTIFICATIONS_QUERY_KEY = "careCompanionNotifications"

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

const ACTION_TYPE_DEEP_LINKS: Record<string, string> = {
  REFILL_NUDGE: "/patients/companion/refill-schedule",
  MISSED_TEST_FLAG: "/patients/companion/refill-schedule",
  COST_SAVING_SUGGESTION: "/patients/companion/cost-tracker",
  DRUG_INTERACTION_WARNING: "/patients/companion/medication-cards",
  PROVIDER_FLAG: "/patients/companion",
  ADHERENCE_PATTERN: "/patients/companion/refill-schedule",
  CIRCLE_PROMPT: "/patients/companion",
  INVOICE_POPULATE: "/patients/companion/cost-tracker",
  DRUG_INFO_SURFACE: "/patients/companion/medication-cards",
  TEST_RESULT_PROMPT: "/patients/companion",
  LOAN_REPAYMENT_PRAISE: "/patients/companion/medication-loan",
  LOAN_REPAYMENT_REMINDER: "/patients/companion/medication-loan",
  LOAN_REPAYMENT_OVERDUE: "/patients/companion/medication-loan",
  LOAN_OFFER: "/patients/companion/medication-loan",
  JIREH_PLUS_RECOMMEND: "/patients/companion",
  NO_ACTION: "/patients/companion",
}

function actionToNotification(action: LlmActionEvent): CareCompanionNotification {
  const now = new Date().toISOString()
  return {
    id: action.id,
    type: "AI_INSIGHT",
    title: action.title,
    body: action.body,
    deepLink: ACTION_TYPE_DEEP_LINKS[action.actionType] ?? "/patients/companion",
    scheduledAt: now,
    sentAt: now,
    readAt: null,
    metadata: {
      actionType: action.actionType,
      severity: action.severity,
      ...(action.relatedMedication
        ? { relatedMedication: action.relatedMedication }
        : {}),
    },
  }
}

async function postNotificationsBatch(
  notifications: CareCompanionNotification[],
): Promise<void> {
  for (const n of notifications) {
    await fetch("/api/care-companion/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n),
    })
  }
}

export function useAiPipeline(profile: CareCompanionProfile | null) {
  const queryClient = useQueryClient()
  const hasRunRef = useRef(false)
  const isRunningRef = useRef(false)
  const [isPipelineRunning, setIsPipelineRunning] = useState(false)

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

      const notifications = newActions
        .filter((a): a is LlmActionEvent => a.type === "LLM_ACTION")
        .filter((a) => a.actionType !== "NO_ACTION" && a.actionType !== "INVOICE_POPULATE")
        .map(actionToNotification)

      if (notifications.length > 0) {
        await postNotificationsBatch(notifications)
        queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] })
      }
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

  return {
    isRunning: isPipelineRunning,
    triggerPipeline,
  }
}
