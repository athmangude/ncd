import { http, HttpResponse } from "msw"
import { makeId } from "../db"
import {
  buildCareCompanionHome,
  getCareCompanionProfile,
  saveCareCompanionProfile,
  patchCareCompanionProfile,
  getPatientMedications,
  getPatientMedicationRecords,
  getMedicationTaxonomy,
  searchTaxonomy,
  getMedicationTimeline,
  getCostSummary,
  getInferredConditions,
  getEmergencyCard,
  getEmergencyTransportCredit,
  getMedicationCards,
  getMedicationInteractions,
  getRefillSchedules,
  getNextEducationCard,
  getEducationCards,
  getEducationViewedIds,
  markEducationViewed,
  getPharmacyStock,
  getMedicationLoanPreApproval,
  matchAssistantResponse,
} from "../domain/careCompanion"

import type { CareCompanionProfile } from "@/types/care-companion"

/**
 * Care Companion MSW handlers.
 *
 * 21 endpoints covering the full care companion feature set: BFF home,
 * medications, timeline, cost tracker, emergency card, medication intelligence,
 * refill schedule, education feed, pharmacy stock, medication loan,
 * AI assistant, interaction check, and profile (intake questionnaire).
 *
 * All data is read from JSON fixtures via the domain module, with localStorage
 * persistence for user mutations (profile saves, education card views).
 */

export const careCompanionHandlers = [
  // -------------------------------------------------------------------------
  // 1. BFF: Aggregated home page data
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/care-companion/home", () => {
    return HttpResponse.json(buildCareCompanionHome())
  }),

  http.get("/care-companion/home", () => {
    return HttpResponse.json(buildCareCompanionHome())
  }),

  // =========================================================================
  // /care-companion/* shortcut handlers
  //
  // The Care Companion hooks fetch from /care-companion/* URLs (no patient id
  // prefix) while the canonical handlers listen on /api/patients/:id/*.
  // Each shortcut below mirrors the response logic of its canonical handler.
  // =========================================================================

  // -- Refill schedule -------------------------------------------------------
  http.get("/care-companion/refill-schedule", () => {
    const schedules = getRefillSchedules()
    return HttpResponse.json({ schedules })
  }),

  // -- Cost summary ----------------------------------------------------------
  http.get("/care-companion/cost-summary", ({ request }) => {
    const url = new URL(request.url)
    const year =
      Number(url.searchParams.get("year")) || new Date().getFullYear()
    const summary = getCostSummary()

    if (summary.year !== year) {
      return HttpResponse.json({
        year,
        ytdSpend: "0",
        monthlyAverage: "0",
        cashbackEarned: "0",
        netSpend: "0",
        annualProjection: "0",
        transactionCount: 0,
        currency: "KES",
      })
    }

    return HttpResponse.json({
      year: summary.year,
      ytdSpend: summary.ytdSpend,
      monthlyAverage: summary.monthlyAverage,
      cashbackEarned: summary.cashbackEarned,
      netSpend: summary.netSpend,
      annualProjection: summary.annualProjection,
      transactionCount: summary.transactionCount,
      currency: summary.currency,
    })
  }),

  // -- Cost breakdown --------------------------------------------------------
  http.get("/care-companion/cost-breakdown", ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 12
    const offset = Number(url.searchParams.get("offset")) || 0

    const summary = getCostSummary()
    const trend = summary.monthlyTrend
    const total = trend.length
    const paged = trend.slice(offset, offset + limit)

    return HttpResponse.json({
      year: summary.year,
      categories: summary.breakdown,
      monthlyTrend: paged,
      pagination: { total, limit, offset },
    })
  }),

  // -- Emergency card --------------------------------------------------------
  http.get("/care-companion/emergency-card", ({ request }) => {
    const url = new URL(request.url)
    const locale = url.searchParams.get("locale") ?? "EN"

    const conditions = getInferredConditions()
    const primaryCondition = conditions[0] ?? "GENERAL"

    const card = getEmergencyCard(primaryCondition, locale)
    if (!card) {
      return HttpResponse.json(null, { status: 404 })
    }

    return HttpResponse.json(card, {
      headers: { "Cache-Control": "public, max-age=86400" },
    })
  }),

  // -- Emergency transport credit --------------------------------------------
  http.get("/care-companion/emergency-transport-credit", () => {
    return HttpResponse.json(getEmergencyTransportCredit())
  }),

  // -- Education feed (all cards with viewed status) -------------------------
  http.get("/care-companion/education-feed", () => {
    const cards = getEducationCards()
    const viewed = getEducationViewedIds()
    return HttpResponse.json({
      cards: cards.map((c) => ({
        ...c,
        viewed: viewed.includes(c.id),
      })),
    })
  }),

  // -- Medication timeline ---------------------------------------------------
  http.get("/care-companion/medication-timeline", ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 20
    const offset = Number(url.searchParams.get("offset")) || 0
    const medicationId = url.searchParams.get("medicationId")

    let entries = getMedicationTimeline()

    if (medicationId) {
      entries = entries.filter(
        (e) =>
          e.medicationName.toLowerCase().includes(medicationId.toLowerCase()),
      )
    }

    const total = entries.length
    const paged = entries.slice(offset, offset + limit)

    const medNames = new Set(entries.map((e) => e.medicationName))
    const facilityNames = new Set(entries.map((e) => e.facilityName))
    const dates = entries.map((e) => e.date).sort()

    return HttpResponse.json({
      entries: paged,
      summary: {
        totalMedications: medNames.size,
        pharmaciesUsed: facilityNames.size,
        dateRange: {
          from: dates[0] ?? "",
          to: dates[dates.length - 1] ?? "",
        },
      },
      pagination: { total, limit, offset },
    })
  }),

  // -- Medication cards ------------------------------------------------------
  http.get("/care-companion/medication-cards", ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 20
    const offset = Number(url.searchParams.get("offset")) || 0

    const allCards = getMedicationCards()
    const interactions = getMedicationInteractions()
    const patientMeds = getPatientMedications()
    const taxonomy = getMedicationTaxonomy()
    const medName = (id: string) =>
      taxonomy.find((t) => t.id === id)?.genericName ?? "Unknown"
    const activeMedIds = patientMeds
      .filter((m) => m.isActive)
      .map((m) => m.medication.id)

    const annotated = allCards.map((card) => {
      const relevantInteractions = interactions.filter(
        (i) =>
          i.medicationAId === card.medicationId ||
          i.medicationBId === card.medicationId,
      )
      return {
        card,
        interactions: relevantInteractions.map((i) => ({
          withMedication:
            i.medicationAId === card.medicationId
              ? (i.medicationBId ? medName(i.medicationBId) : i.herbName ?? "Unknown")
              : medName(i.medicationAId),
          severity: i.severity,
          description: i.descriptionEn,
          recommendation: i.recommendation,
        })),
      }
    })

    const relevant = annotated.filter((a) =>
      activeMedIds.includes(a.card.medicationId),
    )

    const total = relevant.length
    const paged = relevant.slice(offset, offset + limit)

    return HttpResponse.json({
      cards: paged,
      pagination: { total, limit, offset },
    })
  }),

  // -- Medications list ------------------------------------------------------
  http.get("/care-companion/medications", () => {
    const records = getPatientMedicationRecords()
    const taxonomy = getMedicationTaxonomy()

    const medications = records.map((record) => {
      const taxEntry = taxonomy.find((t) => t.id === record.medicationId)
      return {
        ...record,
        medication: {
          genericName: taxEntry?.genericName ?? record.medication.genericName,
          brandNames: taxEntry?.brandNames ?? record.medication.brandNames,
          category: taxEntry?.category ?? record.medication.category,
        },
      }
    })

    return HttpResponse.json({ medications })
  }),

  // -- Medication loan pre-approval ------------------------------------------
  http.get("/care-companion/medication-loan-pre-approval", () => {
    return HttpResponse.json(getMedicationLoanPreApproval())
  }),

  // -- Pharmacy stock --------------------------------------------------------
  http.get("/care-companion/pharmacy-stock", ({ request }) => {
    const url = new URL(request.url)
    const medicationName = url.searchParams.get("medicationId") ?? ""

    let stock = getPharmacyStock()

    if (medicationName) {
      stock = stock.filter((s) =>
        s.medicationName.toLowerCase().includes(medicationName.toLowerCase()),
      )
    }

    stock.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

    return HttpResponse.json(stock)
  }),

  // -- Interaction check -----------------------------------------------------
  http.get("/care-companion/interaction-check", ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 50
    const offset = Number(url.searchParams.get("offset")) || 0

    const allInteractions = getMedicationInteractions()
    const total = allInteractions.length
    const paged = allInteractions.slice(offset, offset + limit)
    const hasSevere = allInteractions.some(
      (i) => i.severity === "SEVERE" || i.severity === "CONTRAINDICATED",
    )

    return HttpResponse.json({
      interactions: paged,
      hasSevereInteraction: hasSevere,
      pagination: { total, limit, offset },
    })
  }),

  // -- AI assistant chat -----------------------------------------------------
  http.post("/care-companion/assistant/chat", async ({ request }) => {
    const body = (await request.json()) as {
      message: string
      sessionId?: string
    }

    const content = typeof body.message === "string" ? body.message : ""
    const conversation = matchAssistantResponse(content)
    const assistantMsg =
      conversation.messages.find((m) => m.role === "ASSISTANT") ??
      conversation.messages[0]

    return HttpResponse.json({
      sessionId: body.sessionId ?? conversation.sessionId,
      reply: assistantMsg.content,
      metadata: {
        suggestedActions: assistantMsg.suggestedActions || [],
      },
      suggestedActions: assistantMsg.suggestedActions || [],
    })
  }),

  // -- Education cards: all cards with viewed status -------------------------
  http.get("/care-companion/education-cards", () => {
    const cards = getEducationCards()
    const viewed = getEducationViewedIds()
    return HttpResponse.json({
      cards: cards.map((c) => ({
        ...c,
        viewed: viewed.includes(c.id),
      })),
    })
  }),

  // -- Education feed: mark card viewed --------------------------------------
  http.post("/care-companion/education-feed/:cardId/viewed", ({ params }) => {
    const { cardId } = params as { cardId: string }
    markEducationViewed(cardId)
    return HttpResponse.json({
      message: "Card marked as viewed",
      viewedIds: getEducationViewedIds(),
    })
  }),

  // -- Profile GET -----------------------------------------------------------
  http.get("/care-companion/profile", () => {
    const profile = getCareCompanionProfile()
    return HttpResponse.json(profile)
  }),

  // -- Profile POST ----------------------------------------------------------
  http.post("/care-companion/profile", async ({ request }) => {
    const body = (await request.json()) as CareCompanionProfile
    const saved = saveCareCompanionProfile(body)
    return HttpResponse.json(saved, { status: 201 })
  }),

  // -- Profile PATCH ---------------------------------------------------------
  http.patch("/care-companion/profile", async ({ request }) => {
    const body = (await request.json()) as Partial<CareCompanionProfile>
    const updated = patchCareCompanionProfile(body)
    return HttpResponse.json(updated)
  }),

  // -- Intake POST -----------------------------------------------------------
  http.post("/care-companion/intake", async ({ request }) => {
    const body = (await request.json()) as CareCompanionProfile
    const saved = saveCareCompanionProfile(body)
    return HttpResponse.json(saved, { status: 201 })
  }),

  // =========================================================================
  // End of /care-companion/* shortcut handlers
  // =========================================================================

  // -------------------------------------------------------------------------
  // 2. Medication taxonomy search
  // -------------------------------------------------------------------------
  http.get("/api/medications/taxonomy", ({ request }) => {
    const url = new URL(request.url)
    const q = url.searchParams.get("q") ?? undefined
    const category = url.searchParams.get("category")
    const limit = Number(url.searchParams.get("limit")) || 20

    let results = searchTaxonomy(q)

    if (category) {
      results = results.filter((entry) => entry.category === category)
    }

    return HttpResponse.json(results.slice(0, limit))
  }),

  // -------------------------------------------------------------------------
  // 3. Patient medication list (with taxonomy enrichment)
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/medications", () => {
    const records = getPatientMedicationRecords()
    const taxonomy = getMedicationTaxonomy()

    // Enrich each record with taxonomy details by joining on medicationId
    const medications = records.map((record) => {
      const taxEntry = taxonomy.find((t) => t.id === record.medicationId)
      return {
        ...record,
        medication: {
          genericName: taxEntry?.genericName ?? record.medication.genericName,
          brandNames: taxEntry?.brandNames ?? record.medication.brandNames,
          category: taxEntry?.category ?? record.medication.category,
        },
      }
    })

    return HttpResponse.json({ medications })
  }),

  // -------------------------------------------------------------------------
  // 3. Medication timeline (paginated)
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/medication-timeline", ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 20
    const offset = Number(url.searchParams.get("offset")) || 0
    const medicationId = url.searchParams.get("medicationId")

    let entries = getMedicationTimeline()

    // Optional filter by medication name (using medicationId as a name filter
    // in the prototype since we use denormalized medication names)
    if (medicationId) {
      entries = entries.filter(
        (e) =>
          e.medicationName.toLowerCase().includes(medicationId.toLowerCase()),
      )
    }

    const total = entries.length
    const paged = entries.slice(offset, offset + limit)

    // Compute summary
    const medNames = new Set(entries.map((e) => e.medicationName))
    const facilityNames = new Set(entries.map((e) => e.facilityName))
    const dates = entries.map((e) => e.date).sort()

    return HttpResponse.json({
      entries: paged,
      summary: {
        totalMedications: medNames.size,
        pharmaciesUsed: facilityNames.size,
        dateRange: {
          from: dates[0] ?? "",
          to: dates[dates.length - 1] ?? "",
        },
      },
      pagination: { total, limit, offset },
    })
  }),

  // -------------------------------------------------------------------------
  // 4. Annual cost summary
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/cost-summary", ({ request }) => {
    const url = new URL(request.url)
    const year =
      Number(url.searchParams.get("year")) || new Date().getFullYear()
    const summary = getCostSummary()

    // Return zero values when the requested year has no data
    if (summary.year !== year) {
      return HttpResponse.json({
        year,
        ytdSpend: "0",
        monthlyAverage: "0",
        cashbackEarned: "0",
        netSpend: "0",
        annualProjection: "0",
        transactionCount: 0,
        currency: "KES",
      })
    }

    return HttpResponse.json({
      year: summary.year,
      ytdSpend: summary.ytdSpend,
      monthlyAverage: summary.monthlyAverage,
      cashbackEarned: summary.cashbackEarned,
      netSpend: summary.netSpend,
      annualProjection: summary.annualProjection,
      transactionCount: summary.transactionCount,
      currency: summary.currency,
    })
  }),

  // -------------------------------------------------------------------------
  // 5. Cost breakdown by category + monthly trend (paginated)
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/cost-summary/breakdown", ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 12
    const offset = Number(url.searchParams.get("offset")) || 0

    const summary = getCostSummary()
    const trend = summary.monthlyTrend
    const total = trend.length
    const paged = trend.slice(offset, offset + limit)

    return HttpResponse.json({
      year: summary.year,
      categories: summary.breakdown,
      monthlyTrend: paged,
      pagination: { total, limit, offset },
    })
  }),

  // -------------------------------------------------------------------------
  // 4b. Annual cost summary (BFF convenience path)
  // -------------------------------------------------------------------------
  http.get("/care-companion/cost-summary", ({ request }) => {
    const url = new URL(request.url)
    const year =
      Number(url.searchParams.get("year")) || new Date().getFullYear()
    const summary = getCostSummary()

    if (summary.year !== year) {
      return HttpResponse.json({
        year,
        ytdSpend: "0",
        monthlyAverage: "0",
        cashbackEarned: "0",
        netSpend: "0",
        annualProjection: "0",
        transactionCount: 0,
        currency: "KES",
      })
    }

    return HttpResponse.json({
      year: summary.year,
      ytdSpend: summary.ytdSpend,
      monthlyAverage: summary.monthlyAverage,
      cashbackEarned: summary.cashbackEarned,
      netSpend: summary.netSpend,
      annualProjection: summary.annualProjection,
      transactionCount: summary.transactionCount,
      currency: summary.currency,
    })
  }),

  // -------------------------------------------------------------------------
  // 5b. Cost breakdown (BFF convenience path)
  // -------------------------------------------------------------------------
  http.get("/care-companion/cost-breakdown", ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 12
    const offset = Number(url.searchParams.get("offset")) || 0

    const summary = getCostSummary()
    const trend = summary.monthlyTrend
    const total = trend.length
    const paged = trend.slice(offset, offset + limit)

    return HttpResponse.json({
      year: summary.year,
      categories: summary.breakdown,
      monthlyTrend: paged,
      pagination: { total, limit, offset },
    })
  }),

  // -------------------------------------------------------------------------
  // 6. Emergency card (condition-inferred from medications)
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/emergency-card", ({ request }) => {
    const url = new URL(request.url)
    const locale = url.searchParams.get("locale") ?? "EN"

    // Infer the patient's primary condition from their medication records
    const conditions = getInferredConditions()
    const primaryCondition = conditions[0] ?? "GENERAL"

    // Fetch the matching card with GENERAL fallback
    const card = getEmergencyCard(primaryCondition, locale)
    if (!card) {
      return HttpResponse.json(null, { status: 404 })
    }

    return HttpResponse.json(card, {
      headers: { "Cache-Control": "public, max-age=86400" },
    })
  }),

  // -------------------------------------------------------------------------
  // 7. Emergency transport credit
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/emergency-transport-credit", () => {
    return HttpResponse.json(getEmergencyTransportCredit())
  }),

  // -------------------------------------------------------------------------
  // 8. Personalised medication cards with interaction annotations
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/medication-cards", ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 20
    const offset = Number(url.searchParams.get("offset")) || 0

    const allCards = getMedicationCards()
    const interactions = getMedicationInteractions()
    const patientMeds = getPatientMedications()
    const taxonomy = getMedicationTaxonomy()
    const medName = (id: string) =>
      taxonomy.find((t) => t.id === id)?.genericName ?? "Unknown"
    const activeMedIds = patientMeds
      .filter((m) => m.isActive)
      .map((m) => m.medication.id)

    // Annotate each card with relevant interactions
    const annotated = allCards.map((card) => {
      const relevantInteractions = interactions.filter(
        (i) =>
          i.medicationAId === card.medicationId ||
          i.medicationBId === card.medicationId,
      )
      return {
        card,
        interactions: relevantInteractions.map((i) => ({
          withMedication:
            i.medicationAId === card.medicationId
              ? (i.medicationBId ? medName(i.medicationBId) : i.herbName ?? "Unknown")
              : medName(i.medicationAId),
          severity: i.severity,
          description: i.descriptionEn,
          recommendation: i.recommendation,
        })),
      }
    })

    // Filter to cards for the patient's active medications
    const relevant = annotated.filter((a) =>
      activeMedIds.includes(a.card.medicationId),
    )

    const total = relevant.length
    const paged = relevant.slice(offset, offset + limit)

    return HttpResponse.json({
      cards: paged,
      pagination: { total, limit, offset },
    })
  }),

  // -------------------------------------------------------------------------
  // 9. Full interaction check across medication list
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/interactions", ({ request }) => {
    const url = new URL(request.url)
    const limit = Number(url.searchParams.get("limit")) || 50
    const offset = Number(url.searchParams.get("offset")) || 0

    const allInteractions = getMedicationInteractions()
    const total = allInteractions.length
    const paged = allInteractions.slice(offset, offset + limit)
    const hasSevere = allInteractions.some(
      (i) => i.severity === "SEVERE" || i.severity === "CONTRAINDICATED",
    )

    return HttpResponse.json({
      interactions: paged,
      hasSevereInteraction: hasSevere,
      pagination: { total, limit, offset },
    })
  }),

  // -------------------------------------------------------------------------
  // 10. Refill schedule
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/refill-schedule", () => {
    const schedules = getRefillSchedules()
    return HttpResponse.json({ schedules })
  }),

  // -------------------------------------------------------------------------
  // 11. Education feed (next unviewed card)
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/education-feed", () => {
    const card = getNextEducationCard()
    return HttpResponse.json(card)
  }),

  // -------------------------------------------------------------------------
  // 12. Mark education card as viewed (persists to localStorage)
  // -------------------------------------------------------------------------
  http.post("/api/patients/:id/education-feed/:cardId/viewed", ({ params }) => {
    const { cardId } = params as { cardId: string }
    markEducationViewed(cardId)
    return HttpResponse.json({
      message: "Card marked as viewed",
      viewedIds: getEducationViewedIds(),
    })
  }),

  // -------------------------------------------------------------------------
  // 13. Education cards list (all cards)
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/education-cards", () => {
    const cards = getEducationCards()
    const viewed = getEducationViewedIds()
    return HttpResponse.json({
      cards: cards.map((c) => ({
        ...c,
        viewed: viewed.includes(c.id),
      })),
    })
  }),

  // -------------------------------------------------------------------------
  // 14. Nearby pharmacies with stock
  // -------------------------------------------------------------------------
  http.get("/api/pharmacies/stock", ({ request }) => {
    const url = new URL(request.url)
    const medicationName = url.searchParams.get("medicationId") ?? ""

    let stock = getPharmacyStock()

    if (medicationName) {
      stock = stock.filter((s) =>
        s.medicationName.toLowerCase().includes(medicationName.toLowerCase()),
      )
    }

    // Sort by distance (closest first)
    stock.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))

    return HttpResponse.json(stock)
  }),

  // -------------------------------------------------------------------------
  // 15. Medication loan pre-approval
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/credit/pre-approval", () => {
    return HttpResponse.json(getMedicationLoanPreApproval())
  }),

  // -------------------------------------------------------------------------
  // 16. Emergency transport credit details
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/credit/emergency-transport", () => {
    return HttpResponse.json(getEmergencyTransportCredit())
  }),

  // -------------------------------------------------------------------------
  // 17. AI assistant: send message (keyword matching)
  // -------------------------------------------------------------------------
  http.post("/api/patients/:id/assistant/message", async ({ request }) => {
    const body = (await request.json()) as {
      content: string
      sessionId?: string
    }

    const content = typeof body.content === "string" ? body.content : ""
    const conversation = matchAssistantResponse(content)
    const assistantMsg =
      conversation.messages.find((m) => m.role === "ASSISTANT") ??
      conversation.messages[0]

    return HttpResponse.json({
      sessionId: body.sessionId ?? conversation.sessionId,
      message: {
        id: makeId("ai-msg"),
        content: assistantMsg.content,
        guardrailFlags: assistantMsg.guardrailFlags,
      },
      suggestedActions: assistantMsg.suggestedActions,
    })
  }),

  // -------------------------------------------------------------------------
  // 18. AI assistant: interaction check
  // -------------------------------------------------------------------------
  http.post(
    "/api/patients/:id/assistant/interaction-check",
    async ({ request }) => {
      const body = (await request.json()) as { productName: string }
      const interactions = getMedicationInteractions()
      const productLower = body.productName.toLowerCase()

      const taxonomy = getMedicationTaxonomy()
      const medName = (id: string) =>
        taxonomy.find((t) => t.id === id)?.genericName ?? "Unknown"

      // Find interactions involving the queried product
      const matching = interactions.filter(
        (i) =>
          medName(i.medicationAId).toLowerCase().includes(productLower) ||
          (i.medicationBId
            ? medName(i.medicationBId).toLowerCase().includes(productLower)
            : false) ||
          (i.herbName?.toLowerCase().includes(productLower) ?? false),
      )

      const severityRank: Record<string, number> = {
        CONTRAINDICATED: 4,
        SEVERE: 3,
        MODERATE: 2,
        MILD: 1,
      }
      const maxSeverity = matching.reduce(
        (max, i) => Math.max(max, severityRank[i.severity] ?? 0),
        0,
      )

      let overallRisk: "NONE" | "LOW" | "MODERATE" | "HIGH" = "NONE"
      if (maxSeverity >= 4) overallRisk = "HIGH"
      else if (maxSeverity >= 3) overallRisk = "HIGH"
      else if (maxSeverity >= 2) overallRisk = "MODERATE"
      else if (maxSeverity >= 1) overallRisk = "LOW"

      return HttpResponse.json({
        productName: body.productName,
        interactions: matching.map((i) => ({
          withMedication:
            medName(i.medicationAId).toLowerCase().includes(productLower)
              ? (i.medicationBId ? medName(i.medicationBId) : i.herbName ?? "Unknown")
              : medName(i.medicationAId),
          severity: i.severity,
          description: i.descriptionEn,
          recommendation: i.recommendation,
        })),
        overallRisk,
        disclaimer:
          "This information is for general reference only. Always consult your pharmacist or doctor before combining medications or herbal remedies.",
      })
    },
  ),

  // -------------------------------------------------------------------------
  // 19. Profile GET (returns null if not saved)
  // -------------------------------------------------------------------------
  http.get("/api/patients/:id/care-companion/profile", () => {
    const profile = getCareCompanionProfile()
    return HttpResponse.json(profile)
  }),

  // -------------------------------------------------------------------------
  // 20. Profile POST (save full profile from intake)
  // -------------------------------------------------------------------------
  http.post(
    "/api/patients/:id/care-companion/profile",
    async ({ request }) => {
      const body = (await request.json()) as CareCompanionProfile
      const saved = saveCareCompanionProfile(body)
      return HttpResponse.json(saved, { status: 201 })
    },
  ),

  // -------------------------------------------------------------------------
  // 21. Profile PATCH (partial update)
  // -------------------------------------------------------------------------
  http.patch(
    "/api/patients/:id/care-companion/profile",
    async ({ request }) => {
      const body = (await request.json()) as Partial<CareCompanionProfile>
      const updated = patchCareCompanionProfile(body)
      return HttpResponse.json(updated)
    },
  ),
]
