import { useCallback, useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

import type {
  CareCompanionEvent,
  CareCompanionProfile,
} from "@/types/care-companion"
import { useCareCompanionStore } from "../store/careCompanionStore"

const EVENTS_QUERY_KEY = ["care-companion", "events"]
const NOTIFICATIONS_QUERY_KEY = "careCompanionNotifications"

async function fetchEvents(): Promise<CareCompanionEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200)
  if (error) return []
  return (data ?? []).map((row: any) => ({
    id: row.id,
    type: row.type,
    timestamp: row.created_at,
    source: row.data?.source ?? "system",
    ...row.data,
  })) as CareCompanionEvent[]
}

export function useAiPipeline(profile: CareCompanionProfile | null) {
  const queryClient = useQueryClient()
  const hasRunRef = useRef(false)
  const isRunningRef = useRef(false)
  const [isPipelineRunning, setIsPipelineRunning] = useState(false)
  const setStoreRunning = useCareCompanionStore(
    (s) => s.setAiPipelineRunning,
  )

  const { data: events = [] } = useQuery({
    queryKey: EVENTS_QUERY_KEY,
    queryFn: fetchEvents,
    staleTime: 30_000,
  })

  const triggerPipeline = useCallback(async () => {
    if (!profile || isRunningRef.current) return
    isRunningRef.current = true

    try {
      setIsPipelineRunning(true)
      setStoreRunning(true)

      await supabase.functions.invoke("generate-ai-insights", {
        body: { trigger: "on_demand" },
      })
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] })
    } catch (err) {
      console.error("[useAiPipeline] Pipeline run failed:", err)
    } finally {
      isRunningRef.current = false
      setIsPipelineRunning(false)
      setStoreRunning(false)
    }
  }, [profile, queryClient, setStoreRunning])

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
