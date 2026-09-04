import { createAdminClient, createUserClient, corsHeaders } from "../_shared/supabase-admin.ts"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")
const CASHBACK_RATE = 0.05
const INVOICE_MEDICATION_COST_RATIO = 0.7

interface LineItem {
  name: string
  category: "MEDICATION" | "LAB_TEST" | "CONSULTATION" | "SUPPLY" | "OTHER"
  quantity: number
  unitPrice: number
  lineTotal: number
}

async function callGemini(prompt: string): Promise<unknown> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 8192,
          temperature: 0.3,
        },
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.status}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]"
  return JSON.parse(text.replace(/```json\n?/g, "").replace(/```/g, "").trim())
}

function validateLineItems(items: unknown, paymentAmount: number): LineItem[] {
  if (!Array.isArray(items)) return []

  const validated = items.filter(
    (item): item is LineItem =>
      typeof item === "object" &&
      item !== null &&
      typeof item.name === "string" &&
      typeof item.category === "string" &&
      ["MEDICATION", "LAB_TEST", "CONSULTATION", "SUPPLY", "OTHER"].includes(item.category) &&
      typeof item.quantity === "number" &&
      typeof item.unitPrice === "number" &&
      typeof item.lineTotal === "number"
  )

  if (validated.length === 0) return []

  const total = validated.reduce((sum, item) => sum + item.lineTotal, 0)
  const tolerance = paymentAmount * 0.1
  if (Math.abs(total - paymentAmount) > tolerance) return []

  return validated
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: corsHeaders })
    }

    const { paymentId } = await req.json()
    if (!paymentId) {
      return new Response(JSON.stringify({ error: "paymentId is required" }), { status: 400, headers: corsHeaders })
    }

    const userClient = createUserClient(authHeader)
    const adminClient = createAdminClient()

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
    }

    const userId = user.id

    const [profileRes, paymentRes, refillsRes] = await Promise.all([
      userClient.from("profiles").select("*").eq("id", userId).single(),
      userClient.from("payments").select("*").eq("id", paymentId).single(),
      userClient.from("refill_schedules").select("*").eq("user_id", userId),
    ])

    if (profileRes.error || !profileRes.data) {
      return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404, headers: corsHeaders })
    }
    if (paymentRes.error || !paymentRes.data) {
      return new Response(JSON.stringify({ error: "Payment not found" }), { status: 404, headers: corsHeaders })
    }

    const profile = profileRes.data
    const payment = paymentRes.data
    const refills = refillsRes.data ?? []

    const prompt = `You are a healthcare invoice AI for Kenya. Generate realistic invoice line items for a payment.

PATIENT CONTEXT:
- Conditions: ${JSON.stringify(profile.conditions)}
- Treatment: ${JSON.stringify(profile.treatment)}
- Upcoming refills: ${JSON.stringify(refills.map((r: { medication_name: string; next_date: string; status: string }) => ({
  medication: r.medication_name,
  nextDate: r.next_date,
  status: r.status,
})))}

PAYMENT:
- Facility: ${payment.facility_name} (${payment.facility_type ?? "hospital"})
- Amount: KES ${payment.amount}

RULES:
- Medication items should represent about ${Math.round(INVOICE_MEDICATION_COST_RATIO * 100)}% of the total
- Use realistic Kenyan healthcare pricing
- Line item totals MUST sum to exactly KES ${payment.amount}
- Each item needs: name, category (MEDICATION|LAB_TEST|CONSULTATION|SUPPLY|OTHER), quantity, unitPrice, lineTotal

Return JSON: { "lineItems": [...] }`

    let lineItems: LineItem[] = []

    if (GEMINI_API_KEY) {
      try {
        const result = await callGemini(prompt) as { lineItems?: unknown }
        lineItems = validateLineItems(result.lineItems ?? result, Number(payment.amount))
      } catch (err) {
        console.error("[generate-invoice-line-items] Gemini failed:", err)
      }
    }

    if (lineItems.length === 0) {
      const amount = Number(payment.amount)
      const medCost = Math.round(amount * INVOICE_MEDICATION_COST_RATIO)
      const consultCost = amount - medCost
      const medName = refills[0]?.medication_name ?? "Medication supply"
      lineItems = [
        { name: `${medName} (30-day supply)`, category: "MEDICATION", quantity: 1, unitPrice: medCost, lineTotal: medCost },
        { name: "General consultation", category: "CONSULTATION", quantity: 1, unitPrice: consultCost, lineTotal: consultCost },
      ]
    }

    const cashbackAmount = Number(payment.amount) * CASHBACK_RATE
    const now = new Date().toISOString()

    await adminClient.from("payments").update({ line_items: lineItems, cashback_amount: cashbackAmount }).eq("id", paymentId)

    await adminClient.from("events").insert({
      user_id: userId,
      type: "PAYMENT",
      data: {
        paymentId,
        facilityName: payment.facility_name,
        totalAmount: Number(payment.amount),
        lineItems,
      },
    })

    const { data: wallet } = await adminClient.from("wallets").select("cashback_balance").eq("user_id", userId).single()
    const currentBalance = Number(wallet?.cashback_balance ?? 0)
    await adminClient.from("wallets").upsert({
      user_id: userId,
      cashback_balance: currentBalance + cashbackAmount,
    })

    await adminClient.from("events").insert({
      user_id: userId,
      type: "CASHBACK_EARNED",
      data: {
        amount: cashbackAmount,
        paymentId,
        newBalance: currentBalance + cashbackAmount,
      },
    })

    await adminClient.from("notifications").insert({
      user_id: userId,
      type: "CASHBACK",
      title: "Cashback earned!",
      body: `You earned KES ${cashbackAmount.toLocaleString()} cashback from your payment at ${payment.facility_name}.`,
      metadata: { paymentId, cashbackAmount },
      deep_link: `/#/patients/care-companion/wallet`,
    })

    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      await fetch(`${supabaseUrl}/functions/v1/generate-ai-insights`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, trigger: "invoice_populated", triggerData: { paymentId } }),
      })
    } catch {
      console.warn("[generate-invoice-line-items] AI insights trigger failed (non-blocking)")
    }

    return new Response(JSON.stringify({ lineItems, cashbackAmount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("[generate-invoice-line-items] Error:", err)
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders })
  }
})
