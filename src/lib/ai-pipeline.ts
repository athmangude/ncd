import type {
  CareCompanionEvent,
  CareCompanionProfile,
  LlmActionEvent,
  LlmActionType,
  LoanRepaymentEvent,
  PaymentEvent,
} from "@/types/care-companion"
import {
  CASHBACK_ACTIONABLE_MIN_KES,
  INVOICE_MEDICATION_COST_RATIO,
  JIREH_PLUS_DISCOUNT_RATE,
  JIREH_PLUS_MONTHLY_THRESHOLD_KES,
  JIREH_PLUS_PROJECTION_WINDOW_MONTHS,
  LOAN_OFFER_HIGH_COST_THRESHOLD_KES,
  LOAN_OFFER_MIN_COMPLETED_LOANS,
  LOAN_OFFER_MIN_REPAYMENT_STREAK,
  LOAN_REMINDER_WINDOW_DAYS,
  MAX_EVENTS_FOR_LLM,
  MIN_CIRCLE_MEMBERS,
  RECENT_PAYMENT_WINDOW_DAYS,
} from "@/lib/ai-pipeline-rules"

// ---------------------------------------------------------------------------
// Input hash — deterministic fingerprint of the data sent to the LLM.
// If the hash matches the last LLM event's inputHash, we skip the call.
// ---------------------------------------------------------------------------

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text)
  const buf = await crypto.subtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

export async function computeInputHash(
  profile: CareCompanionProfile,
  events: CareCompanionEvent[],
): Promise<string> {
  const payload = JSON.stringify({
    conditions: profile.conditions,
    treatment: profile.treatment,
    challenges: profile.challenges,
    accountData: profile.accountData,
    events: events
      .filter((e) => e.type !== "LLM_ACTION")
      .map((e) => ({ type: e.type, id: e.id })),
  })
  return sha256(payload)
}

// ---------------------------------------------------------------------------
// Dedup check
// ---------------------------------------------------------------------------

export function shouldSkipPipeline(
  events: CareCompanionEvent[],
  currentHash: string,
): boolean {
  const llmEvents = events
    .filter((e): e is LlmActionEvent => e.type === "LLM_ACTION")
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  if (llmEvents.length === 0) return false
  return llmEvents[0].inputHash === currentHash
}

// ---------------------------------------------------------------------------
// System prompt for the care companion AI pipeline
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  const discountPct = Math.round(JIREH_PLUS_DISCOUNT_RATE * 100)
  return `You are the Jireh Care Companion AI, an intelligent health assistant for NCD patients in Kenya. You analyze patient data and events to produce actionable insights.

You will receive a patient profile (conditions, medications, challenges, account data including cashback balance, Jireh Plus status, and circle members) and their recent events (medication purchases, schedule changes, payments, cashback earned, circle membership changes).

Respond with a JSON array of actions. Each action has:
- actionType: one of REFILL_NUDGE, MISSED_TEST_FLAG, COST_SAVING_SUGGESTION, DRUG_INTERACTION_WARNING, PROVIDER_FLAG, ADHERENCE_PATTERN, CIRCLE_PROMPT, INVOICE_POPULATE, DRUG_INFO_SURFACE, TEST_RESULT_PROMPT, LOAN_REPAYMENT_PRAISE, LOAN_REPAYMENT_REMINDER, LOAN_REPAYMENT_OVERDUE, LOAN_OFFER, JIREH_PLUS_RECOMMEND, NO_ACTION
- title: short headline (max 60 chars)
- body: 1-3 sentence explanation, written for a Kenyan caregiver/patient in plain language. Use KES for currency. Be specific about medications and amounts.
- severity: INFO, WARNING, or CRITICAL
- relatedMedication: medication name if applicable, else null
- invoiceLineItems: (ONLY for INVOICE_POPULATE actions) array of objects with { name, category, quantity, unitPrice, lineTotal }. category is one of MEDICATION, LAB_TEST, CONSULTATION, SUPPLY, OTHER. Omit for all other action types.

Rules:
- REFILL_NUDGE: when a refill schedule item is approaching or overdue
- MISSED_TEST_FLAG: when a lab test is overdue or the patient hasn't had one in a while
- COST_SAVING_SUGGESTION: when you spot opportunities to save (generic alternatives, pharmacy comparison, cashback optimization, circle cost-sharing)
- DRUG_INTERACTION_WARNING: when the medication list has known interactions, including with herbal remedies the patient reported
- PROVIDER_FLAG: for demo purposes only — imply the system noticed a pattern worth clinical attention (stretching refill intervals, multiple missed doses). Do NOT diagnose or prescribe.
- ADHERENCE_PATTERN: when refill intervals are stretching or purchases are declining
- CIRCLE_PROMPT: when the patient could benefit from adding circle members (for cost sharing, emotional support) or when cashback sharing could help
- INVOICE_POPULATE: when you see a PAYMENT event with empty lineItems, generate realistic invoice line items based on the patient's profile. Look at their upcoming refill schedule, recurring tests, and consultation patterns. The total of all lineTotal values should approximate the payment amount. Always include invoiceLineItems in the response for this action type.
- DRUG_INFO_SURFACE: when a PAYMENT event's line items (either pre-existing or just populated) contain a MEDICATION purchase, surface a drug information card for that medication. Include dosage guidance, common side effects, and any interaction warnings with the patient's other medications.
- TEST_RESULT_PROMPT: when a PAYMENT event's line items contain a LAB_TEST purchase, prompt the patient to upload their test results once available. Mention the specific test name and why tracking results helps their care plan.
- NO_ACTION: when everything looks fine. Still return it as a single-item array.

PAYMENT EVENT PROCESSING:
When you see recent PAYMENT events (within the last ${RECENT_PAYMENT_WINDOW_DAYS} days):
1. If a payment has empty lineItems, first produce an INVOICE_POPULATE action with invoiceLineItems that realistically explain what the patient paid for based on their profile. The line items should sum to approximately the payment amount.
2. Then, based on the line items (populated or pre-existing), produce DRUG_INFO_SURFACE for any medications and TEST_RESULT_PROMPT for any lab tests. These are separate actions — one per medication or test.
3. You may generate multiple actions from a single payment event.

The profile includes projectedMonthlyCosts — a 6-month forward projection of monthly medication, test, and consultation costs. Use these projections for:
- Cost-saving suggestions: compare projected spend against historical average, flag months that are significantly higher
- Jireh Plus recommendations: if any projected month exceeds KES ${JIREH_PLUS_MONTHLY_THRESHOLD_KES.toLocaleString()} and the patient is NOT on Jireh Plus, recommend upgrading with the specific month and projected amount. Do NOT recommend Jireh Plus if the patient already has an ACTIVE status.

LOAN INTELLIGENCE:
The profile includes activeLoan (current loan details), creditLimit, repaymentStreak, and totalLoansCompleted.
When you see LOAN_REPAYMENT events:
- LOAN_REPAYMENT_PRAISE: when the patient makes an on-time repayment. Mention their streak count. If their next refill aligns with the loan purpose, connect the dots ("your medication loan is on track, and your next Metformin refill is covered").
- LOAN_REPAYMENT_REMINDER: when a repayment is due within ${LOAN_REMINDER_WINDOW_DAYS} days (based on activeLoan.nextRepaymentDate). Mention the amount and suggest M-Ratiba auto-deduction if method is MPESA.
- LOAN_REPAYMENT_OVERDUE: when you see a LOAN_OVERDUE event. Be empathetic, not punitive. Mention the outstanding amount and offer to connect with support. Severity should be WARNING, not CRITICAL.
- LOAN_OFFER: when the patient has no active loan, has good credit (creditLimit > 0, repaymentStreak >= ${LOAN_OFFER_MIN_REPAYMENT_STREAK} or totalLoansCompleted >= ${LOAN_OFFER_MIN_COMPLETED_LOANS}), and an upcoming high-cost month in projectedMonthlyCosts. Suggest a loan to cover the specific upcoming expense. Never suggest a loan if there is already an activeLoan.
- JIREH_PLUS_RECOMMEND: when the patient is NOT on Jireh Plus (jirehPlusStatus is not ACTIVE) and any projected month in the next ${JIREH_PLUS_PROJECTION_WINDOW_MONTHS} months exceeds KES ${JIREH_PLUS_MONTHLY_THRESHOLD_KES.toLocaleString()}. Include the specific month, projected total, and estimated savings (${discountPct}% of in-network costs). Do NOT recommend if the patient already has ACTIVE Jireh Plus status.

FINANCIAL OPTIMIZATION:
- Cashback optimization: if the patient has cashback balance > KES ${CASHBACK_ACTIONABLE_MIN_KES} and an upcoming refill or loan repayment, suggest the most impactful way to apply it (refill > loan repayment > circle share).
- Loan + refill collision detection: if the patient has an activeLoan and a refill is due in the same week as a loan repayment, flag the financial overlap and suggest planning (e.g., use cashback for one, M-Pesa for the other, or request a refill loan top-up).
- Post-loan celebration: if the patient's activeLoan shows remaining balance is 0 or the last repayment number equals totalRepayments, congratulate them and mention their improved credit limit.

If the patient uses herbal alternatives, flag potential interactions with their medications.
If circle membership is low (<${MIN_CIRCLE_MEMBERS} members), suggest adding members for cost-sharing benefits.
If cashback balance is available and a refill is upcoming, mention it as a funding source.

Return ONLY valid JSON. No markdown, no explanation outside the array.`
}

// ---------------------------------------------------------------------------
// Build user message from profile + events
// ---------------------------------------------------------------------------

function stripPii(obj: Record<string, unknown>): Record<string, unknown> {
  const piiKeys = new Set([
    "phoneNumber", "phone", "email", "idNumber", "name",
    "firstName", "lastName", "fullName", "inviteePhone",
  ])
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (piiKeys.has(key)) continue
    cleaned[key] = value
  }
  return cleaned
}

function sanitizeAccountData(
  accountData: CareCompanionProfile["accountData"],
) {
  if (!accountData) return accountData
  const { circleMembers, ...rest } = accountData
  return {
    ...rest,
    circleMemberCount: circleMembers?.length ?? 0,
  }
}

function buildUserMessage(
  profile: CareCompanionProfile,
  events: CareCompanionEvent[],
): string {
  const recentEvents = events
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, MAX_EVENTS_FOR_LLM)

  return JSON.stringify({
    profile: {
      conditions: profile.conditions,
      treatment: profile.treatment,
      challenges: profile.challenges,
      goals: profile.goals,
      costEstimates: profile.costEstimates,
      recurringTests: profile.recurringTests,
      userRole: profile.userRole,
      accountData: sanitizeAccountData(profile.accountData),
    },
    recentEvents: recentEvents.map((e) => {
      const { id: _id, ...rest } = e
      return stripPii(rest as unknown as Record<string, unknown>)
    }),
  })
}

// ---------------------------------------------------------------------------
// Gemini API call via Vite proxy
// ---------------------------------------------------------------------------

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[]
    }
    finishReason?: string
  }[]
}

interface RawAction {
  actionType: LlmActionType
  title: string
  body: string
  severity: "INFO" | "WARNING" | "CRITICAL"
  relatedMedication: string | null
  invoiceLineItems?: {
    name: string
    category: "MEDICATION" | "LAB_TEST" | "CONSULTATION" | "SUPPLY" | "OTHER"
    quantity: number
    unitPrice: number
    lineTotal: number
  }[]
}

const VALID_ACTION_TYPES = new Set<string>([
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
    if (Object.prototype.hasOwnProperty.call(obj, "__proto__") || Object.prototype.hasOwnProperty.call(obj, "constructor")) return false
    return (
      typeof obj.actionType === "string" &&
      VALID_ACTION_TYPES.has(obj.actionType) &&
      typeof obj.title === "string" &&
      obj.title.length <= 200 &&
      typeof obj.body === "string" &&
      obj.body.length <= 2000 &&
      typeof obj.severity === "string" &&
      VALID_SEVERITIES.has(obj.severity)
    )
  })
}

export async function callLlmApi(
  profile: CareCompanionProfile,
  events: CareCompanionEvent[],
): Promise<RawAction[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    // Fallback disabled — return empty when no API key
    return []
  }

  try {
    const model = "gemini-3.6-flash"
    const url = `/api/gemini/v1beta/models/${model}:generateContent?key=${apiKey}`

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: buildSystemPrompt() }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: buildUserMessage(profile, events) }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    })

    if (!res.ok) {
      console.error("[ai-pipeline] Gemini API error:", res.status)
      return []
    }

    const data = (await res.json()) as GeminiResponse
    const finishReason = data.candidates?.[0]?.finishReason
    if (finishReason === "MAX_TOKENS") {
      console.warn("[ai-pipeline] Response truncated (MAX_TOKENS) — output incomplete, skipping")
      return []
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```/g, "").trim()
    const parsed: unknown = JSON.parse(jsonStr)
    const validated = validateActions(parsed)
    if (validated.length === 0) {
      console.warn("[ai-pipeline] LLM response failed validation")
      return []
    }
    return validated
  } catch (err) {
    console.error("[ai-pipeline] Gemini API call failed:", err)
    return []
  }
}

// ---------------------------------------------------------------------------
// Fallback: deterministic actions when no API key is available
// ---------------------------------------------------------------------------

function generateFallbackActions(
  profile: CareCompanionProfile,
  events: CareCompanionEvent[],
): RawAction[] {
  const actions: RawAction[] = []
  const meds = profile.treatment?.medicationNames ?? []

  const paymentEvents = events.filter((e) => e.type === "PAYMENT")
  const lastPayment = paymentEvents.sort(
    (a, b) => b.timestamp.localeCompare(a.timestamp),
  )[0]

  if (meds.length >= 2) {
    actions.push({
      actionType: "DRUG_INTERACTION_WARNING",
      title: "Medication interaction check",
      body: `You are taking ${meds[0]} and ${meds[1]}. No harmful interactions are known between these medications, but always inform your pharmacist about all medications you take.`,
      severity: "INFO",
      relatedMedication: meds[0],
    })
  }

  if (profile.treatment?.usingHerbalAlternatives && meds.length > 0) {
    actions.push({
      actionType: "DRUG_INTERACTION_WARNING",
      title: "Herbal remedy interaction risk",
      body: `You reported using herbal alternatives alongside ${meds[0]}. Some herbal remedies can reduce the effectiveness of your medication or cause dangerous interactions. Please discuss with your pharmacist.`,
      severity: "WARNING",
      relatedMedication: meds[0],
    })
  }

  const cashback = profile.accountData?.cashbackBalance ?? 0
  if (cashback > CASHBACK_ACTIONABLE_MIN_KES && lastPayment) {
    actions.push({
      actionType: "COST_SAVING_SUGGESTION",
      title: "Use your cashback balance",
      body: `You have KES ${cashback.toLocaleString()} in cashback. Consider applying it to your next medication refill to reduce out-of-pocket costs.`,
      severity: "INFO",
      relatedMedication: null,
    })
  }

  const circleSize = profile.accountData?.circleMembers?.length ?? 0
  if (circleSize < MIN_CIRCLE_MEMBERS) {
    actions.push({
      actionType: "CIRCLE_PROMPT",
      title: "Grow your Jireh Circle",
      body: `Your circle has ${circleSize} member${circleSize === 1 ? "" : "s"}. Adding family members enables cost-sharing through cashback and improves your credit eligibility for medication loans.`,
      severity: "INFO",
      relatedMedication: null,
    })
  }

  const projections = profile.accountData?.projectedMonthlyCosts ?? []
  const highCostMonth = projections
    .slice(0, JIREH_PLUS_PROJECTION_WINDOW_MONTHS)
    .find((m) => m.total > JIREH_PLUS_MONTHLY_THRESHOLD_KES)
  if (
    highCostMonth &&
    profile.accountData?.jirehPlusStatus !== "ACTIVE"
  ) {
    const estimatedSavings = Math.round(highCostMonth.total * JIREH_PLUS_DISCOUNT_RATE)
    actions.push({
      actionType: "JIREH_PLUS_RECOMMEND",
      title: "Jireh Plus could save you money",
      body: `Your projected costs for ${highCostMonth.month} are KES ${highCostMonth.total.toLocaleString()}. With Jireh Plus, you'd save approximately KES ${estimatedSavings.toLocaleString()} (${Math.round(JIREH_PLUS_DISCOUNT_RATE * 100)}% on in-network purchases). That's enough to cover a month of ${meds[0] ?? "medication"}.`,
      severity: "WARNING",
      relatedMedication: null,
    })
  }

  const recentPaymentWindowMs = RECENT_PAYMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const recentPayments = events.filter(
    (e): e is PaymentEvent =>
      e.type === "PAYMENT" &&
      Date.now() - new Date(e.timestamp).getTime() < recentPaymentWindowMs,
  )

  for (const payment of recentPayments) {
    if (!payment.lineItems || payment.lineItems.length === 0) {
      const refillMed = meds[0] ?? "Metformin"
      const medCost = Math.round(payment.totalAmount * INVOICE_MEDICATION_COST_RATIO)
      const consultCost = payment.totalAmount - medCost
      actions.push({
        actionType: "INVOICE_POPULATE",
        title: `Invoice for ${payment.facilityName}`,
        body: `Based on your care plan, this payment likely covered a ${refillMed} refill and a consultation at ${payment.facilityName}.`,
        severity: "INFO",
        relatedMedication: refillMed,
        invoiceLineItems: [
          {
            name: `${refillMed} (30-day supply)`,
            category: "MEDICATION",
            quantity: 1,
            unitPrice: medCost,
            lineTotal: medCost,
          },
          {
            name: "General consultation",
            category: "CONSULTATION",
            quantity: 1,
            unitPrice: consultCost,
            lineTotal: consultCost,
          },
        ],
      })
      actions.push({
        actionType: "DRUG_INFO_SURFACE",
        title: `About ${refillMed}`,
        body: `You purchased ${refillMed}. Take it with food to reduce stomach upset. ${meds.length >= 2 ? `No known harmful interactions with ${meds[1]}, but always inform your pharmacist about all medications.` : "Always inform your pharmacist about all medications you take."}`,
        severity: "INFO",
        relatedMedication: refillMed,
      })
    } else {
      const medItems = payment.lineItems.filter(
        (li: { category: string }) => li.category === "MEDICATION",
      )
      const testItems = payment.lineItems.filter(
        (li: { category: string }) => li.category === "LAB_TEST",
      )
      for (const med of medItems) {
        actions.push({
          actionType: "DRUG_INFO_SURFACE",
          title: `About ${med.name}`,
          body: `You purchased ${med.name}. Take as prescribed and report any unusual side effects to your healthcare provider.`,
          severity: "INFO",
          relatedMedication: med.name,
        })
      }
      for (const test of testItems) {
        actions.push({
          actionType: "TEST_RESULT_PROMPT",
          title: `Upload ${test.name} results`,
          body: `You paid for a ${test.name} at ${payment.facilityName}. Once your results are ready, upload them here so we can track trends in your care plan.`,
          severity: "INFO",
          relatedMedication: null,
        })
      }
    }
  }

  // -----------------------------------------------------------------------
  // Loan intelligence fallback
  // -----------------------------------------------------------------------
  const activeLoan = profile.accountData?.activeLoan
  const repaymentStreak = profile.accountData?.repaymentStreak ?? 0

  const loanRepayments = events
    .filter(
      (e): e is LoanRepaymentEvent => e.type === "LOAN_REPAYMENT",
    )
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

  const latestRepayment = loanRepayments[0]
  if (latestRepayment?.isOnTime) {
    const streakText =
      repaymentStreak > 1
        ? ` That's ${repaymentStreak} on-time payments in a row.`
        : ""
    actions.push({
      actionType: "LOAN_REPAYMENT_PRAISE",
      title: "Repayment received",
      body: `Your KES ${latestRepayment.amount.toLocaleString()} repayment was received on time.${streakText} You're ${latestRepayment.repaymentNumber} of ${latestRepayment.totalRepayments} repayments through your loan.`,
      severity: "INFO",
      relatedMedication: null,
    })
  }

  if (activeLoan && !activeLoan.isOverdue) {
    const dueDate = new Date(activeLoan.nextRepaymentDate)
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
    )
    if (daysUntilDue <= LOAN_REMINDER_WINDOW_DAYS && daysUntilDue >= 0) {
      actions.push({
        actionType: "LOAN_REPAYMENT_REMINDER",
        title: "Repayment due soon",
        body: `Your next loan repayment of KES ${activeLoan.nextRepaymentAmount.toLocaleString()} is due ${daysUntilDue === 0 ? "today" : daysUntilDue === 1 ? "tomorrow" : "in 2 days"}. Set up M-Ratiba auto-deduction to never miss a payment.`,
        severity: "WARNING",
        relatedMedication: null,
      })
    }
  }

  const overdueEvents = events.filter((e) => e.type === "LOAN_OVERDUE")
  if (overdueEvents.length > 0) {
    const latest = overdueEvents.sort(
      (a, b) => b.timestamp.localeCompare(a.timestamp),
    )[0]
    if (latest.type === "LOAN_OVERDUE") {
      actions.push({
        actionType: "LOAN_REPAYMENT_OVERDUE",
        title: "Missed repayment",
        body: `Your loan repayment is ${latest.daysOverdue} day${latest.daysOverdue === 1 ? "" : "s"} overdue. Outstanding balance: KES ${latest.outstandingBalance.toLocaleString()}. We understand things can be tight. Reach out to our support team if you need help.`,
        severity: "WARNING",
        relatedMedication: null,
      })
    }
  }

  if (
    !activeLoan &&
    (profile.accountData?.creditLimit ?? 0) > 0 &&
    (repaymentStreak >= LOAN_OFFER_MIN_REPAYMENT_STREAK ||
      (profile.accountData?.totalLoansCompleted ?? 0) >= LOAN_OFFER_MIN_COMPLETED_LOANS)
  ) {
    const loanHighMonth = projections.find((m) => m.total > LOAN_OFFER_HIGH_COST_THRESHOLD_KES)
    if (loanHighMonth) {
      actions.push({
        actionType: "LOAN_OFFER",
        title: "Medication loan available",
        body: `Your projected costs for ${loanHighMonth.month} are KES ${loanHighMonth.total.toLocaleString()}. With your strong repayment history, you qualify for a medication loan up to KES ${(profile.accountData?.creditLimit ?? 0).toLocaleString()}.`,
        severity: "INFO",
        relatedMedication: null,
      })
    }
  }

  // -----------------------------------------------------------------------
  // Financial optimization fallback
  // -----------------------------------------------------------------------
  if (cashback > CASHBACK_ACTIONABLE_MIN_KES && activeLoan && !activeLoan.isOverdue) {
    actions.push({
      actionType: "COST_SAVING_SUGGESTION",
      title: "Apply cashback to your loan",
      body: `You have KES ${cashback.toLocaleString()} in cashback. Applying it to your next loan repayment of KES ${activeLoan.nextRepaymentAmount.toLocaleString()} reduces your out-of-pocket cost.`,
      severity: "INFO",
      relatedMedication: null,
    })
  }

  if (
    latestRepayment &&
    latestRepayment.repaymentNumber === latestRepayment.totalRepayments
  ) {
    const creditLimit = profile.accountData?.creditLimit ?? 0
    actions.push({
      actionType: "COST_SAVING_SUGGESTION",
      title: "Loan completed!",
      body: `Congratulations — you've paid off your medication loan! Your strong repayment record means you now qualify for up to KES ${creditLimit.toLocaleString()} on your next loan. Keep up the consistent care.`,
      severity: "INFO",
      relatedMedication: null,
    })
  }

  if (profile.conditions?.diagnosisRecency === "LESS_THAN_6_MONTHS") {
    actions.push({
      actionType: "ADHERENCE_PATTERN",
      title: "Early in your care journey",
      body: "You were diagnosed recently. The first 6 months are critical for establishing a medication routine. Try to refill on time every month — consistent adherence makes the biggest difference early on.",
      severity: "INFO",
      relatedMedication: null,
    })
  }

  if (actions.length === 0) {
    actions.push({
      actionType: "NO_ACTION",
      title: "Looking good",
      body: "Your medication schedule and care plan are on track. Keep up the good work!",
      severity: "INFO",
      relatedMedication: null,
    })
  }

  return actions
}

// ---------------------------------------------------------------------------
// Full pipeline run: hash → dedup → call → convert to events
// ---------------------------------------------------------------------------

export async function runPipeline(
  profile: CareCompanionProfile,
  events: CareCompanionEvent[],
): Promise<LlmActionEvent[]> {
  const inputHash = await computeInputHash(profile, events)

  if (shouldSkipPipeline(events, inputHash)) {
    console.info("[ai-pipeline] Skipping — input hash unchanged since last LLM run")
    return []
  }

  const actions = await callLlmApi(profile, events)
  const now = new Date().toISOString()

  return actions.map((action) => {
    return {
      id: `llm-${crypto.randomUUID()}`,
      type: "LLM_ACTION" as const,
      timestamp: now,
      source: "llm" as const,
      actionType: action.actionType,
      title: action.title,
      body: action.body,
      severity: action.severity,
      relatedMedication: action.relatedMedication,
      relatedScheduleId: null,
      inputHash,
      dismissed: false,
      ...(action.invoiceLineItems && {
        invoiceLineItems: action.invoiceLineItems,
      }),
    }
  })
}
