import { createAdminClient, createUserClient } from "../_shared/supabase-admin.ts"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
const MAX_EVENTS_FOR_LLM = 50
const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000
const BATCH_RATE_LIMIT_DELAY_MS = 6000

interface RawAction {
  actionType: string
  title: string
  body: string
  severity: "INFO" | "WARNING" | "CRITICAL"
  relatedMedication: string | null
  invoiceLineItems?: unknown[]
}

const VALID_ACTION_TYPES = new Set([
  "REFILL_NUDGE", "MISSED_TEST_FLAG", "COST_SAVING_SUGGESTION",
  "DRUG_INTERACTION_WARNING", "PROVIDER_FLAG", "ADHERENCE_PATTERN",
  "CIRCLE_PROMPT", "INVOICE_POPULATE", "DRUG_INFO_SURFACE",
  "TEST_RESULT_PROMPT", "LOAN_REPAYMENT_PRAISE", "LOAN_REPAYMENT_REMINDER",
  "LOAN_REPAYMENT_OVERDUE", "LOAN_OFFER", "JIREH_PLUS_RECOMMEND", "NO_ACTION",
])

const VALID_SEVERITIES = new Set(["INFO", "WARNING", "CRITICAL"])

function validateActions(raw: unknown): RawAction[] {
  const arr = Array.isArray(raw) ? raw : [raw]
  return arr.filter((item): item is RawAction => {
    if (typeof item !== "object" || item === null) return false
    const obj = item as Record<string, unknown>
    return (
      typeof obj.actionType === "string" &&
      VALID_ACTION_TYPES.has(obj.actionType) &&
      typeof obj.title === "string" &&
      (obj.title as string).length <= 200 &&
      typeof obj.body === "string" &&
      (obj.body as string).length <= 2000 &&
      typeof obj.severity === "string" &&
      VALID_SEVERITIES.has(obj.severity as string)
    )
  })
}

function buildSystemPrompt(): string {
  return `You are the Jireh Care Companion AI, an intelligent health assistant for NCD patients in Kenya. You analyze patient data and events to produce actionable insights.

You will receive a patient profile (conditions, medications, challenges, account data) and their recent events.

Respond with a JSON array of actions. Each action has:
- actionType: one of REFILL_NUDGE, MISSED_TEST_FLAG, COST_SAVING_SUGGESTION, DRUG_INTERACTION_WARNING, PROVIDER_FLAG, ADHERENCE_PATTERN, CIRCLE_PROMPT, DRUG_INFO_SURFACE, TEST_RESULT_PROMPT, LOAN_REPAYMENT_PRAISE, LOAN_REPAYMENT_REMINDER, LOAN_REPAYMENT_OVERDUE, LOAN_OFFER, JIREH_PLUS_RECOMMEND, NO_ACTION
- title: short headline (max 60 chars)
- body: 1-3 sentence explanation, written for a Kenyan caregiver/patient in plain language. Use KES for currency.
- severity: INFO, WARNING, or CRITICAL
- relatedMedication: medication name if applicable, else null

Rules:
- REFILL_NUDGE: when a refill schedule item is approaching or overdue
- MISSED_TEST_FLAG: when a lab test is overdue
- COST_SAVING_SUGGESTION: opportunities to save (generics, cashback, circle cost-sharing)
- DRUG_INTERACTION_WARNING: known interactions between medications or herbal remedies
- PROVIDER_FLAG: patterns worth clinical attention (stretching refill intervals, missed doses)
- ADHERENCE_PATTERN: declining refill purchases or stretching intervals
- CIRCLE_PROMPT: benefit from adding circle members
- JIREH_PLUS_RECOMMEND: when projected monthly costs exceed KES 8,000 and patient is NOT on Jireh Plus
- LOAN_OFFER: when eligible and upcoming high-cost month
- NO_ACTION: when everything looks fine

If cashback balance > KES 200 and a refill is upcoming, mention it as a funding source.
Return ONLY valid JSON. No markdown, no explanation outside the array.`
}

async function callGemini(systemPrompt: string, userMessage: string): Promise<unknown> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
          temperature: 0.3,
        },
      }),
    }
  )

  if (!res.ok) throw new Error(`Gemini API error: ${res.status}`)

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"
  return JSON.parse(text.replace(/```json\n?/g, "").replace(/```/g, "").trim())
}

interface TriggerContext {
  trigger: string
  triggerData: Record<string, unknown>
}

function buildTriggerContext(ctx: TriggerContext): string {
  const triggerMessages: Record<string, string> = {
    prescription: `User just had a prescription detected with medications: ${JSON.stringify(ctx.triggerData.medications)}. Provide dosage, interaction, and refill timing insights.`,
    test_upload: `User just uploaded lab results for ${ctx.triggerData.testName}. Analyze trends and suggest next steps.`,
    course_complete: `User just completed the education course "${ctx.triggerData.courseTitle}". Recommend follow-up courses and reinforce key takeaways.`,
    refill_overdue: `User's ${ctx.triggerData.medicationName} refill is ${ctx.triggerData.daysPastDue} days overdue. Provide a nudge with nearby pharmacy suggestion.`,
    test_overdue: `User's ${ctx.triggerData.testName} test is ${ctx.triggerData.daysPastDue} days overdue. Remind with cost estimate.`,
    cashback_milestone: `User reached a cashback milestone of KES ${ctx.triggerData.balance}. Suggest applying to upcoming refill.`,
    invoice_populated: `An invoice was just populated with line items. Generate relevant drug info and test result prompts.`,
  }
  return triggerMessages[ctx.trigger] ?? ""
}

async function processUser(
  adminClient: ReturnType<typeof createAdminClient>,
  userId: string,
  triggerCtx?: TriggerContext,
) {
  const [profileRes, eventsRes, refillsRes, testsRes, educationRes] = await Promise.all([
    adminClient.from("profiles").select("*").eq("id", userId).single(),
    adminClient.from("events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(MAX_EVENTS_FOR_LLM),
    adminClient.from("refill_schedules").select("*").eq("user_id", userId),
    adminClient.from("test_schedules").select("*").eq("user_id", userId),
    adminClient.from("education_progress").select("*, education_content(title, slug, conditions)").eq("user_id", userId),
  ])

  if (profileRes.error || !profileRes.data) return { userId, status: "no_profile" }

  const profile = profileRes.data
  const events = eventsRes.data ?? []
  const refills = refillsRes.data ?? []
  const tests = testsRes.data ?? []
  const education = educationRes.data ?? []

  const userMessage = JSON.stringify({
    profile: {
      conditions: profile.conditions,
      treatment: profile.treatment,
      challenges: profile.challenges,
      goals: profile.goals,
      costEstimates: profile.cost_estimates,
      recurringTests: profile.recurring_tests,
    },
    recentEvents: events.map((e: { type: string; data: unknown; created_at: string }) => ({
      type: e.type,
      data: e.data,
      timestamp: e.created_at,
    })),
    refillSchedules: refills.map((r: { medication_name: string; next_date: string; status: string }) => ({
      medication: r.medication_name,
      nextDate: r.next_date,
      status: r.status,
    })),
    testSchedules: tests.map((t: { test_name: string; next_date: string; status: string }) => ({
      test: t.test_name,
      nextDate: t.next_date,
      status: t.status,
    })),
    educationProgress: education.map((e: { completed: boolean; education_content: { title: string; slug: string } | null }) => ({
      completed: e.completed,
      courseTitle: e.education_content?.title,
      courseSlug: e.education_content?.slug,
    })),
    ...(triggerCtx ? { triggerContext: buildTriggerContext(triggerCtx) } : {}),
  })

  let systemPrompt = buildSystemPrompt()
  if (triggerCtx) {
    systemPrompt += `\n\nTRIGGER CONTEXT:\n${buildTriggerContext(triggerCtx)}`
  }

  const raw = await callGemini(systemPrompt, userMessage)
  const actions = validateActions(raw)

  if (actions.length === 0) return { userId, status: "no_actions" }

  const dedupCutoff = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString()
  const { data: recentNotifications } = await adminClient
    .from("notifications")
    .select("type, metadata")
    .eq("user_id", userId)
    .gte("sent_at", dedupCutoff)

  const existingActions = new Set(
    (recentNotifications ?? []).map(
      (n: { type: string; metadata: Record<string, unknown> }) =>
        `${n.type}:${(n.metadata as Record<string, string>)?.actionType ?? ""}`
    )
  )

  const newActions = actions.filter(
    (a) => a.actionType !== "NO_ACTION" && !existingActions.has(`AI_INSIGHT:${a.actionType}`)
  )

  if (newActions.length === 0) return { userId, status: "all_deduped" }

  const notifications = newActions.map((action) => ({
    user_id: userId,
    type: "AI_INSIGHT",
    title: action.title,
    body: action.body,
    metadata: {
      actionType: action.actionType,
      severity: action.severity,
      relatedMedication: action.relatedMedication,
    },
    deep_link: getDeepLink(action.actionType),
  }))

  await adminClient.from("notifications").insert(notifications)

  return { userId, status: "ok", actionsCreated: newActions.length }
}

function getDeepLink(actionType: string): string {
  const links: Record<string, string> = {
    REFILL_NUDGE: "/#/patients/care-companion/refills",
    MISSED_TEST_FLAG: "/#/patients/care-companion/tests",
    COST_SAVING_SUGGESTION: "/#/patients/care-companion/wallet",
    DRUG_INTERACTION_WARNING: "/#/patients/care-companion/medications",
    ADHERENCE_PATTERN: "/#/patients/care-companion/refills",
    CIRCLE_PROMPT: "/#/patients/care-companion/circles",
    JIREH_PLUS_RECOMMEND: "/#/patients/care-companion/wallet",
    LOAN_OFFER: "/#/patients/care-companion/wallet",
    LOAN_REPAYMENT_PRAISE: "/#/patients/care-companion/wallet",
    LOAN_REPAYMENT_REMINDER: "/#/patients/care-companion/wallet",
    LOAN_REPAYMENT_OVERDUE: "/#/patients/care-companion/wallet",
  }
  return links[actionType] ?? "/#/patients/care-companion"
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401 })
    }

    const body = await req.json()
    const { userId, batch, trigger, triggerData } = body
    const adminClient = createAdminClient()

    if (batch) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id")
        .not("completed_at", "is", null)

      if (!profiles || profiles.length === 0) {
        return new Response(JSON.stringify({ processed: 0 }))
      }

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const results = []
      let processed = 0

      for (const profile of profiles) {
        const { data: recentNotif } = await adminClient
          .from("notifications")
          .select("id")
          .eq("user_id", profile.id)
          .gte("sent_at", oneHourAgo)
          .limit(1)

        if (recentNotif && recentNotif.length > 0) {
          results.push({ userId: profile.id, status: "skipped_recent" })
          continue
        }

        try {
          const result = await processUser(adminClient, profile.id)
          results.push(result)
          processed++
          if (processed % 10 === 0) await delay(BATCH_RATE_LIMIT_DELAY_MS)
        } catch (err) {
          console.error(`[batch] Error processing ${profile.id}:`, err)
          results.push({ userId: profile.id, status: "error" })
        }
      }

      return new Response(JSON.stringify({ processed, results }), {
        headers: { "Content-Type": "application/json" },
      })
    }

    if (userId) {
      const triggerCtx = trigger ? { trigger, triggerData: triggerData ?? {} } : undefined
      const result = await processUser(adminClient, userId, triggerCtx)
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      })
    }

    const userClient = createUserClient(authHeader)
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const triggerCtx = trigger ? { trigger, triggerData: triggerData ?? {} } : undefined
    const result = await processUser(adminClient, user.id, triggerCtx)
    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("[generate-ai-insights] Error:", err)
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 })
  }
})
