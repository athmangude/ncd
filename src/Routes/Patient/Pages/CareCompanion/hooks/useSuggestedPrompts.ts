import { useQuery } from "@tanstack/react-query"
import { useIntakeProfile } from "./useIntakeProfile"
import { generateSuggestedQuestions } from "@/lib/ai-pipeline"
import { supabase } from "@/lib/supabase"
import type { CareCompanionEvent } from "@/types/care-companion"

const FALLBACK_PROMPTS = [
  "What should I know about my medications?",
  "What foods should I eat for better health?",
  "When should I go to the hospital?",
  "How can I stay on top of my health?",
]

async function fetchEvents(): Promise<CareCompanionEvent[]> {
  try {
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
      source: "system",
      ...row.data,
    })) as CareCompanionEvent[]
  } catch {
    return []
  }
}

export function useSuggestedPrompts() {
  const { data: profile } = useIntakeProfile()

  return useQuery({
    queryKey: ["assistantSuggestedPrompts", profile?.id],
    queryFn: async () => {
      if (!profile) return FALLBACK_PROMPTS

      const events = await fetchEvents()
      const questions = await generateSuggestedQuestions(profile, events)
      return questions.length > 0 ? questions : FALLBACK_PROMPTS
    },
    enabled: profile !== undefined,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  })
}
