import { createAdminClient, createUserClient, corsHeaders } from "../_shared/supabase-admin.ts"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")

function buildAssistantSystemPrompt(
  profile: Record<string, unknown> | null,
  events: Array<{ type: string; data: unknown; created_at: string }>,
): string {
  const contextJson = profile
    ? JSON.stringify({
        profile: {
          conditions: profile.conditions,
          treatment: profile.treatment,
          challenges: profile.challenges,
          goals: profile.goals,
          costEstimates: profile.cost_estimates,
          recurringTests: profile.recurring_tests,
        },
        recentEvents: events.map((e) => ({
          type: e.type,
          data: e.data,
          timestamp: e.created_at,
        })),
      })
    : JSON.stringify({ profile: null, recentEvents: [] })

  return `You are the Jireh Care Assistant, a warm and knowledgeable health companion for patients and caregivers managing chronic conditions in Kenya.

CONTEXT:
${contextJson}

GUIDELINES:
- Speak in plain, warm language — like a knowledgeable pharmacist friend. Use "you" and "your".
- Be specific: reference the patient's actual medications, conditions, and recent activity from the context above.
- Use KES for any monetary amounts. Reference Kenyan foods, facilities, and lifestyle when giving advice.
- Keep answers concise — 2-4 short paragraphs max. Use bullet points for lists.
- For medication questions: include dosage guidance, common side effects, food interactions, and storage tips when relevant.
- For diet questions: suggest specific Kenyan foods (ugali, sukuma wiki, omena, etc.) and realistic meal ideas.
- For cost questions: reference their cashback balance, Jireh Plus status, and circle if relevant.
- NEVER diagnose conditions or prescribe medication. Always recommend consulting a doctor or pharmacist for clinical decisions.
- If the question is outside your scope (emergency symptoms, mental health crisis), direct them to call 112 or visit the nearest hospital.
- End with a brief, actionable takeaway when appropriate.

Also generate 3 suggested follow-up questions the user might want to ask, specific to their profile and the current conversation topic. Return your response as JSON: { "reply": "...", "suggestedQuestions": ["...", "...", "..."] }`
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

    const { message, conversationHistory } = await req.json()
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message is required" }), { status: 400, headers: corsHeaders })
    }

    const userClient = createUserClient(authHeader)
    const adminClient = createAdminClient()

    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders })
    }

    const userId = user.id

    const [profileRes, eventsRes, chatRes] = await Promise.all([
      userClient.from("profiles").select("*").eq("id", userId).single(),
      userClient.from("events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      userClient.from("chat_messages").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    ])

    const profile = profileRes.data
    const events = eventsRes.data ?? []
    const storedMessages = (chatRes.data ?? []).reverse()

    const systemPrompt = buildAssistantSystemPrompt(profile, events)

    const history = conversationHistory?.length > 0
      ? conversationHistory
      : storedMessages.map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "model" : "user",
          content: m.content,
        }))

    const contents = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : m.role,
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message }] },
    ]

    if (!GEMINI_API_KEY) {
      const fallbackReply = "I'm sorry, the AI assistant is not available right now. Please try again later."
      await adminClient.from("chat_messages").insert([
        { user_id: userId, role: "user", content: message },
        { user_id: userId, role: "assistant", content: fallbackReply },
      ])
      return new Response(JSON.stringify({ reply: fallbackReply, suggestedQuestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            responseMimeType: "application/json",
          },
        }),
      }
    )

    if (!res.ok) {
      console.error("[chat-assistant] Gemini API error:", res.status)
      const errorReply = "I'm having trouble connecting right now. Please try again in a moment."
      await adminClient.from("chat_messages").insert([
        { user_id: userId, role: "user", content: message },
        { user_id: userId, role: "assistant", content: errorReply },
      ])
      return new Response(JSON.stringify({ reply: errorReply, suggestedQuestions: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const data = await res.json()
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

    let reply = ""
    let suggestedQuestions: string[] = []

    try {
      const parsed = JSON.parse(rawText.replace(/```json\n?/g, "").replace(/```/g, "").trim())
      reply = parsed.reply ?? rawText
      suggestedQuestions = Array.isArray(parsed.suggestedQuestions)
        ? parsed.suggestedQuestions.filter((q: unknown) => typeof q === "string").slice(0, 4)
        : []
    } catch {
      reply = rawText || "I wasn't able to generate a response. Please try again."
    }

    await adminClient.from("chat_messages").insert([
      { user_id: userId, role: "user", content: message },
      { user_id: userId, role: "assistant", content: reply },
    ])

    return new Response(JSON.stringify({ reply, suggestedQuestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (err) {
    console.error("[chat-assistant] Error:", err)
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders })
  }
})
