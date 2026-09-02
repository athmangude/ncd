import { createUserClient } from "../_shared/supabase-admin.ts"

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")

interface TestMetric {
  name: string
  value: number
  unit: string
  referenceRange: string
  status: "NORMAL" | "LOW" | "HIGH" | "CRITICAL"
}

interface TestResults {
  metrics: TestMetric[]
  labName: string
  date: string
}

const KENYAN_LABS = [
  "Nairobi Hospital Laboratory",
  "Lancet Kenya - Upperhill",
  "PathCare Kenya - Westlands",
  "Mediheal Hospital Lab - Parklands",
  "Aga Khan University Hospital Lab",
  "Kenyatta National Hospital Lab",
]

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401 })
    }

    const { testName } = await req.json()
    if (!testName || typeof testName !== "string") {
      return new Response(JSON.stringify({ error: "testName is required" }), { status: 400 })
    }

    const userClient = createUserClient(authHeader)
    const { data: { user }, error: userError } = await userClient.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })
    }

    const userId = user.id

    const [profileRes, prevResultsRes] = await Promise.all([
      userClient.from("profiles").select("*").eq("id", userId).single(),
      userClient.from("events").select("data, created_at")
        .eq("user_id", userId)
        .eq("type", "TEST_RESULT")
        .order("created_at", { ascending: false })
        .limit(5),
    ])

    const profile = profileRes.data
    const previousResults = prevResultsRes.data ?? []

    const previousResultsContext = previousResults
      .filter((r: { data: Record<string, unknown> }) =>
        (r.data as { testName?: string }).testName === testName
      )
      .map((r: { data: Record<string, unknown>; created_at: string }) => ({
        date: r.created_at,
        metrics: (r.data as { metrics?: unknown }).metrics,
      }))

    if (!GEMINI_API_KEY) {
      const fallback = generateFallbackResults(testName)
      return new Response(JSON.stringify(fallback), {
        headers: { "Content-Type": "application/json" },
      })
    }

    const prompt = `Generate clinically plausible lab test results for a patient in Kenya.

PATIENT:
- Conditions: ${JSON.stringify(profile?.conditions ?? [])}
- Treatment: ${JSON.stringify(profile?.treatment ?? {})}
- Previous results for this test: ${JSON.stringify(previousResultsContext)}

TEST: ${testName}

RULES:
- Values must be medically consistent with the patient's conditions and treatment adherence
- If previous results exist, show realistic trends (gradual improvement for adherent patients)
- Include all standard metrics for this test type
- Each metric needs: name, value (number), unit, referenceRange (string like "4.0 - 5.6"), status (NORMAL|LOW|HIGH|CRITICAL)
- Use standard medical units
- Pick a realistic Kenyan lab name

Return JSON: { "metrics": [...], "labName": "...", "date": "${new Date().toISOString().split("T")[0]}" }`

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: 4096,
              temperature: 0.5,
            },
          }),
        }
      )

      if (!res.ok) {
        console.error("[generate-mock-test-results] Gemini error:", res.status)
        return new Response(JSON.stringify(generateFallbackResults(testName)), {
          headers: { "Content-Type": "application/json" },
        })
      }

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
      const parsed = JSON.parse(text.replace(/```json\n?/g, "").replace(/```/g, "").trim()) as TestResults

      const validated: TestResults = {
        metrics: Array.isArray(parsed.metrics)
          ? parsed.metrics.filter(
              (m: unknown): m is TestMetric => {
                const obj = m as Record<string, unknown>
                return (
                  typeof obj.name === "string" &&
                  typeof obj.value === "number" &&
                  typeof obj.unit === "string" &&
                  typeof obj.referenceRange === "string" &&
                  typeof obj.status === "string" &&
                  ["NORMAL", "LOW", "HIGH", "CRITICAL"].includes(obj.status as string)
                )
              }
            )
          : [],
        labName: typeof parsed.labName === "string" ? parsed.labName : KENYAN_LABS[0],
        date: typeof parsed.date === "string" ? parsed.date : new Date().toISOString().split("T")[0],
      }

      if (validated.metrics.length === 0) {
        return new Response(JSON.stringify(generateFallbackResults(testName)), {
          headers: { "Content-Type": "application/json" },
        })
      }

      return new Response(JSON.stringify(validated), {
        headers: { "Content-Type": "application/json" },
      })
    } catch (err) {
      console.error("[generate-mock-test-results] Gemini call failed:", err)
      return new Response(JSON.stringify(generateFallbackResults(testName)), {
        headers: { "Content-Type": "application/json" },
      })
    }
  } catch (err) {
    console.error("[generate-mock-test-results] Error:", err)
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 })
  }
})

function generateFallbackResults(testName: string): TestResults {
  const labName = KENYAN_LABS[Math.floor(Math.random() * KENYAN_LABS.length)]
  const date = new Date().toISOString().split("T")[0]

  const testMetrics: Record<string, TestMetric[]> = {
    "HbA1c Test": [
      { name: "HbA1c", value: 7.2, unit: "%", referenceRange: "4.0 - 5.6", status: "HIGH" },
      { name: "Estimated Average Glucose", value: 160, unit: "mg/dL", referenceRange: "70 - 126", status: "HIGH" },
    ],
    "Lipid Panel": [
      { name: "Total Cholesterol", value: 195, unit: "mg/dL", referenceRange: "< 200", status: "NORMAL" },
      { name: "LDL Cholesterol", value: 120, unit: "mg/dL", referenceRange: "< 100", status: "HIGH" },
      { name: "HDL Cholesterol", value: 52, unit: "mg/dL", referenceRange: "> 40", status: "NORMAL" },
      { name: "Triglycerides", value: 145, unit: "mg/dL", referenceRange: "< 150", status: "NORMAL" },
    ],
    "Kidney Function Test": [
      { name: "Creatinine", value: 1.1, unit: "mg/dL", referenceRange: "0.7 - 1.3", status: "NORMAL" },
      { name: "BUN", value: 18, unit: "mg/dL", referenceRange: "7 - 20", status: "NORMAL" },
      { name: "eGFR", value: 78, unit: "mL/min/1.73m²", referenceRange: "> 60", status: "NORMAL" },
      { name: "Uric Acid", value: 6.5, unit: "mg/dL", referenceRange: "3.5 - 7.2", status: "NORMAL" },
    ],
    "Complete Blood Count": [
      { name: "Hemoglobin", value: 13.5, unit: "g/dL", referenceRange: "12.0 - 16.0", status: "NORMAL" },
      { name: "White Blood Cells", value: 7.2, unit: "×10³/µL", referenceRange: "4.0 - 11.0", status: "NORMAL" },
      { name: "Platelets", value: 245, unit: "×10³/µL", referenceRange: "150 - 400", status: "NORMAL" },
      { name: "Hematocrit", value: 40, unit: "%", referenceRange: "36 - 46", status: "NORMAL" },
    ],
    "Blood Pressure Check": [
      { name: "Systolic BP", value: 138, unit: "mmHg", referenceRange: "< 120", status: "HIGH" },
      { name: "Diastolic BP", value: 88, unit: "mmHg", referenceRange: "< 80", status: "HIGH" },
      { name: "Heart Rate", value: 72, unit: "bpm", referenceRange: "60 - 100", status: "NORMAL" },
    ],
    "Fasting Blood Sugar": [
      { name: "Fasting Glucose", value: 132, unit: "mg/dL", referenceRange: "70 - 100", status: "HIGH" },
    ],
  }

  const metrics = testMetrics[testName] ?? [
    { name: testName, value: 95, unit: "units", referenceRange: "70 - 120", status: "NORMAL" as const },
  ]

  return { metrics, labName, date }
}
