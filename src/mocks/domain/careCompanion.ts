/**
 * Care Companion domain helpers.
 *
 * Encapsulates all read/write logic for the care companion feature set:
 * profile CRUD, education viewed tracking, and AI keyword matching.
 * Handlers call through here instead of touching localStorage directly.
 *
 * Fixtures are imported statically and used as seeds on first access.
 * User mutations (saving a profile, marking education cards viewed) persist
 * to localStorage via the db.ts helpers and survive page reloads.
 */

import {
  readObject,
  writeObject,
  patchObject,
  readCollection,
  writeCollection,
  makeId,
} from "../db"

import type {
  CareCompanionProfile,
  CareCompanionHome,
  CareCompanionNotification,
  CostSummary,
  CostCategoryBreakdown,
  CostBreakdownResponse,
  MonthlySpend,
  RefillSchedule,
  EducationContentCard,
  EmergencyCard,
  EmergencyReferenceCard,
  EmergencyTransportCredit,
  PatientMedication,
  PatientMedicationRecord,
  MedicationTaxonomyEntry,
  NotificationType,
  TimelineEntry,
  MedicationCard,
  MedicationInteraction,
  PharmacyStock,
  MedicationLoanPreApproval,
  AssistantMessage,
  PaginatedResponse,
  ConditionType,
  ContentLocale,
} from "@/types/care-companion"

import patientMedicationsSeed from "../fixtures/patient-medications.json"
import patientMedicationRecordsSeed from "../fixtures/patient-medication-records.json"
import medicationTaxonomySeed from "../fixtures/medication-taxonomy.json"
import medicationTimelineSeed from "../fixtures/medication-timeline.json"
import careCompanionTimelineSeed from "../fixtures/care-companion-timeline.json"
import costSummarySeed from "../fixtures/cost-summary.json"
import careCompanionCostBreakdownSeed from "../fixtures/care-companion-cost-breakdown.json"
import emergencyCardsSeed from "../fixtures/emergency-cards.json"
import emergencyReferenceCardsSeed from "../fixtures/emergency-reference-cards.json"
import medicationCardsSeed from "../fixtures/medication-cards.json"
import medicationInteractionsSeed from "../fixtures/medication-interactions.json"
import refillSchedulesSeed from "../fixtures/refill-schedules.json"
import educationCardsSeed from "../fixtures/education-cards.json"
import pharmacyStockSeed from "../fixtures/pharmacy-stock.json"
import medicationLoanPreapprovalSeed from "../fixtures/medication-loan-preapproval.json"
import emergencyTransportCreditSeed from "../fixtures/emergency-transport-credit.json"
import aiConversationsSeed from "../fixtures/ai-assistant-conversations.json"
import careCompanionProfileSeed from "../fixtures/care-companion-profile.json"
import careCompanionNotificationsSeed from "../fixtures/care-companion-notifications.json"

// ---------------------------------------------------------------------------
// localStorage keys
// ---------------------------------------------------------------------------

const PROFILE_KEY = "care-companion-profile"
const EDUCATION_VIEWED_KEY = "care-companion-education-viewed"
const PATIENT_MEDICATIONS_KEY = "care-companion-patient-medications"
const MEDICATION_TIMELINE_KEY = "care-companion-medication-timeline"
const COST_SUMMARY_KEY = "care-companion-cost-summary"
const EMERGENCY_CARDS_KEY = "care-companion-emergency-cards"
const MEDICATION_CARDS_KEY = "care-companion-medication-cards"
const MEDICATION_INTERACTIONS_KEY = "care-companion-medication-interactions"
const REFILL_SCHEDULES_KEY = "care-companion-refill-schedules"
const EDUCATION_CARDS_KEY = "care-companion-education-cards"
const PHARMACY_STOCK_KEY = "care-companion-pharmacy-stock"
const MEDICATION_LOAN_KEY = "care-companion-medication-loan"
const EMERGENCY_TRANSPORT_KEY = "care-companion-emergency-transport"
const MEDICATION_TAXONOMY_KEY = "care-companion-medication-taxonomy"
const PATIENT_MEDICATION_RECORDS_KEY = "care-companion-patient-medication-records"
const COST_BREAKDOWN_KEY = "care-companion-cost-breakdown"
const CARE_COMPANION_TIMELINE_KEY = "care-companion-timeline"
const EMERGENCY_REFERENCE_CARDS_KEY = "care-companion-emergency-reference-cards"

// ---------------------------------------------------------------------------
// Profile CRUD
// ---------------------------------------------------------------------------

/**
 * Returns the saved care companion profile, or null if no profile exists.
 * A missing profile is a valid state (intake questionnaire not completed).
 */
export function getCareCompanionProfile(): CareCompanionProfile | null {
  const raw = localStorage.getItem("mock:" + PROFILE_KEY)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as CareCompanionProfile
  } catch {
    return null
  }
}

/** Save a full profile (POST from intake completion). Returns the saved profile. */
export function saveCareCompanionProfile(
  profile: CareCompanionProfile,
): CareCompanionProfile {
  writeObject(PROFILE_KEY, profile)
  return profile
}

/** Shallow-merge a partial update into the existing profile (PATCH). */
export function patchCareCompanionProfile(
  patch: Partial<CareCompanionProfile>,
): CareCompanionProfile {
  const current = getCareCompanionProfile()
  const seed = careCompanionProfileSeed as unknown as CareCompanionProfile
  const base = current ?? seed
  return patchObject(PROFILE_KEY, base, patch)
}

// ---------------------------------------------------------------------------
// Education viewed tracking
// ---------------------------------------------------------------------------

/** IDs of education cards the patient has viewed (persisted to localStorage). */
export function getEducationViewedIds(): string[] {
  return readObject<string[]>(EDUCATION_VIEWED_KEY, [])
}

/** Mark an education card as viewed. Idempotent. */
export function markEducationViewed(cardId: string): void {
  const viewed = getEducationViewedIds()
  if (!viewed.includes(cardId)) {
    writeObject(EDUCATION_VIEWED_KEY, [...viewed, cardId])
  }
}

// ---------------------------------------------------------------------------
// Fixture data accessors
// ---------------------------------------------------------------------------

export function getPatientMedications(): PatientMedication[] {
  return readCollection<PatientMedication>(
    PATIENT_MEDICATIONS_KEY,
    patientMedicationsSeed as unknown as PatientMedication[],
  )
}

export function getMedicationTimeline(): TimelineEntry[] {
  return readCollection<TimelineEntry>(
    MEDICATION_TIMELINE_KEY,
    medicationTimelineSeed as unknown as TimelineEntry[],
  )
}

/** Pagination options for the timeline endpoint. */
interface TimelineOptions {
  medicationId?: string
  limit: number
  offset: number
}

/**
 * Returns a paginated slice of the medication timeline, optionally
 * filtered by medication name. Uses the care-companion-timeline fixture
 * which has the full purchase history for the patient.
 */
export function getTimeline(
  options: TimelineOptions,
): PaginatedResponse<TimelineEntry> {
  const { medicationId, limit, offset } = options

  let entries = readCollection<TimelineEntry>(
    CARE_COMPANION_TIMELINE_KEY,
    careCompanionTimelineSeed as unknown as TimelineEntry[],
  )

  if (medicationId) {
    const lowerMedId = medicationId.toLowerCase()
    entries = entries.filter(
      (e) => e.medicationName.toLowerCase().includes(lowerMedId),
    )
  }

  const total = entries.length
  const paged = entries.slice(offset, offset + limit)

  return {
    data: paged,
    pagination: { total, limit, offset },
  }
}

/**
 * Internal mock-layer type extending CostSummary with breakdown and
 * monthlyTrend fields present in the JSON fixture. Intentionally local
 * to the mock layer -- these fields are not part of the CostSummary API
 * contract; the handler splits them into separate endpoint responses.
 */
interface CostSummaryFixture extends CostSummary {
  breakdown: CostCategoryBreakdown[]
  monthlyTrend: MonthlySpend[]
}

/**
 * Returns the annual cost summary. The optional year parameter selects the
 * year to query; in the mock layer only one year of fixture data exists so
 * the fixture is returned with the year field adjusted when needed.
 */
export function getCostSummary(year?: number): CostSummaryFixture {
  const summary = readObject<CostSummaryFixture>(
    COST_SUMMARY_KEY,
    costSummarySeed as unknown as CostSummaryFixture,
  )
  if (year !== undefined && summary.year !== year) {
    return { ...summary, year }
  }
  return summary
}

/**
 * Returns cost breakdown by category with monthly trend data. Reads from
 * the dedicated cost breakdown fixture which includes pagination metadata.
 * The optional year parameter adjusts the returned year field.
 */
export function getCostBreakdown(year?: number): CostBreakdownResponse {
  const breakdown = readObject<CostBreakdownResponse>(
    COST_BREAKDOWN_KEY,
    careCompanionCostBreakdownSeed as unknown as CostBreakdownResponse,
  )
  if (year !== undefined && breakdown.year !== year) {
    return { ...breakdown, year }
  }
  return breakdown
}

export function getEmergencyCards(): EmergencyCard[] {
  return readCollection<EmergencyCard>(
    EMERGENCY_CARDS_KEY,
    emergencyCardsSeed as unknown as EmergencyCard[],
  )
}

export function getMedicationCards(): MedicationCard[] {
  return readCollection<MedicationCard>(
    MEDICATION_CARDS_KEY,
    medicationCardsSeed as unknown as MedicationCard[],
  )
}

export function getMedicationInteractions(): MedicationInteraction[] {
  return readCollection<MedicationInteraction>(
    MEDICATION_INTERACTIONS_KEY,
    medicationInteractionsSeed as unknown as MedicationInteraction[],
  )
}

export function getRefillSchedules(): RefillSchedule[] {
  return readCollection<RefillSchedule>(
    REFILL_SCHEDULES_KEY,
    refillSchedulesSeed as unknown as RefillSchedule[],
  )
}

/** Alias for getRefillSchedules matching the spec-aligned function name. */
export function getRefillSchedule(): RefillSchedule[] {
  return getRefillSchedules()
}

export function getEducationCards(): EducationContentCard[] {
  return readCollection<EducationContentCard>(
    EDUCATION_CARDS_KEY,
    educationCardsSeed as unknown as EducationContentCard[],
  )
}

/**
 * Returns pharmacy stock entries. When facilityId is provided, returns
 * only stock entries for that facility. Otherwise returns all entries.
 */
export function getPharmacyStock(facilityId?: number): PharmacyStock[] {
  const stock = readCollection<PharmacyStock>(
    PHARMACY_STOCK_KEY,
    pharmacyStockSeed as unknown as PharmacyStock[],
  )

  if (facilityId !== undefined) {
    return stock.filter((s) => s.facilityId === facilityId)
  }

  return stock
}

/**
 * Returns pharmacy stock entries for a specific medication across all
 * nearby facilities, sorted by distance (closest first). Matches on
 * medication name using case-insensitive substring matching.
 */
export function getNearbyStock(medicationId: string): PharmacyStock[] {
  const stock = getPharmacyStock()
  const lower = medicationId.toLowerCase()

  const matching = stock.filter(
    (s) => s.medicationName.toLowerCase().includes(lower),
  )

  return matching.sort(
    (a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity),
  )
}

export function getMedicationLoanPreApproval(): MedicationLoanPreApproval {
  return readObject<MedicationLoanPreApproval>(
    MEDICATION_LOAN_KEY,
    medicationLoanPreapprovalSeed as unknown as MedicationLoanPreApproval,
  )
}

export function getEmergencyTransportCredit(): EmergencyTransportCredit {
  return readObject<EmergencyTransportCredit>(
    EMERGENCY_TRANSPORT_KEY,
    emergencyTransportCreditSeed as unknown as EmergencyTransportCredit,
  )
}

// ---------------------------------------------------------------------------
// Medication taxonomy and patient medication records (Phase 0)
// ---------------------------------------------------------------------------

/** Full medication taxonomy seeded from the reference fixture. */
export function getMedicationTaxonomy(): MedicationTaxonomyEntry[] {
  return readCollection<MedicationTaxonomyEntry>(
    MEDICATION_TAXONOMY_KEY,
    medicationTaxonomySeed as unknown as MedicationTaxonomyEntry[],
  )
}

/**
 * Search the medication taxonomy by freetext query. Matches against
 * genericName, brandNames, and synonyms (case-insensitive substring).
 * Returns all active entries when no query is provided.
 */
export function searchTaxonomy(query?: string): MedicationTaxonomyEntry[] {
  const all = getMedicationTaxonomy()
  if (!query || query.trim() === "") return all

  const lower = query.toLowerCase()
  return all.filter((entry) => {
    if (entry.genericName.toLowerCase().includes(lower)) return true
    if (entry.brandNames?.some((b) => b.toLowerCase().includes(lower)))
      return true
    if (entry.synonyms?.some((s) => s.toLowerCase().includes(lower)))
      return true
    return false
  })
}

/**
 * Patient medication records from the PatientMedicationRecord fixture.
 * Uses the spec-aligned format with medicationId FK and denormalized
 * medication subset (genericName, brandNames, category).
 */
export function getPatientMedicationRecords(): PatientMedicationRecord[] {
  return readCollection<PatientMedicationRecord>(
    PATIENT_MEDICATION_RECORDS_KEY,
    patientMedicationRecordsSeed as unknown as PatientMedicationRecord[],
  )
}

/**
 * Find a single patient medication record by its id. Returns undefined
 * when the id does not match any record in the collection.
 */
export function getPatientMedicationById(
  id: string,
): PatientMedicationRecord | undefined {
  return getPatientMedicationRecords().find((record) => record.id === id)
}

// ---------------------------------------------------------------------------
// Education feed: next unviewed card
// ---------------------------------------------------------------------------

/**
 * Returns the next unviewed education card for the given condition type
 * and locale. Includes GENERAL cards as fallback content. Returns null
 * when all relevant cards have been viewed.
 */
export function getEducationFeed(
  conditionType?: ConditionType | string,
  locale: ContentLocale | string = "EN",
): EducationContentCard | null {
  const viewed = getEducationViewedIds()
  const cards = getEducationCards()

  const relevant = cards.filter((c) => {
    const localeMatch = c.locale === locale
    const conditionMatch =
      !conditionType ||
      c.conditionType === conditionType ||
      c.conditionType === "GENERAL"
    return localeMatch && conditionMatch
  })

  const sorted = [...relevant].sort((a, b) => a.weekNumber - b.weekNumber)
  return sorted.find((c) => !viewed.includes(c.id)) ?? null
}

/**
 * Returns the next education card the patient has not viewed, filtered by
 * condition type if a profile exists. Returns null when all cards for the
 * patient's conditions have been viewed.
 */
export function getNextEducationCard(): EducationContentCard | null {
  const viewed = getEducationViewedIds()
  const cards = getEducationCards()
  const profile = getCareCompanionProfile()

  const conditionTypes: string[] = profile?.conditions?.type ?? []

  // Filter cards to the patient's conditions (or show GENERAL for everyone)
  const relevant = cards.filter(
    (c) =>
      conditionTypes.includes(c.conditionType) ||
      c.conditionType === "GENERAL",
  )

  // Sort by weekNumber and return the first unviewed card
  const sorted = [...relevant].sort((a, b) => a.weekNumber - b.weekNumber)
  return sorted.find((c) => !viewed.includes(c.id)) ?? null
}

// ---------------------------------------------------------------------------
// Emergency card: condition-matched
// ---------------------------------------------------------------------------

/**
 * Returns the emergency card matching the patient's primary condition.
 * Falls back to GENERAL when no condition match.
 */
export function getMatchedEmergencyCard(): EmergencyCard | undefined {
  const cards = getEmergencyCards()
  const profile = getCareCompanionProfile()
  const conditions: string[] = profile?.conditions?.type ?? []

  // Try to match the first condition in the patient's list
  for (const condition of conditions) {
    const match = cards.find(
      (c) => c.conditionType === condition && c.locale === "EN",
    )
    if (match) return match
  }

  // Fallback to GENERAL
  const general = cards.find(
    (c) => c.conditionType === "GENERAL" && c.locale === "EN",
  )
  return general ?? cards[0]
}

/**
 * Infers condition types from the patient's active medication records.
 * Collects unique inferredConditions across all active medications,
 * excluding GENERAL (which is a fallback, not a real condition).
 */
export function getInferredConditions(): string[] {
  const medications = getPatientMedications()
  const active = medications.filter((m) => m.isActive)

  const conditionSet = new Set<string>()
  for (const med of active) {
    for (const condition of med.inferredConditions) {
      if (condition !== "GENERAL") {
        conditionSet.add(condition)
      }
    }
  }

  return Array.from(conditionSet)
}

/**
 * Returns all published emergency reference cards from the fixture.
 */
export function getEmergencyReferenceCards(): EmergencyReferenceCard[] {
  return readCollection<EmergencyReferenceCard>(
    EMERGENCY_REFERENCE_CARDS_KEY,
    emergencyReferenceCardsSeed as unknown as EmergencyReferenceCard[],
  )
}

/**
 * Find the emergency reference card matching a specific condition type
 * and locale. Only considers published cards. Falls back to GENERAL in
 * the same locale when no exact condition match exists, then to the first
 * published card as a last resort.
 */
export function getEmergencyCard(
  conditionType: ConditionType | string,
  locale: ContentLocale | string = "EN",
): EmergencyReferenceCard | undefined {
  const cards = getEmergencyReferenceCards()
  const published = cards.filter((c) => c.isPublished)

  const exactMatch = published.find(
    (c) => c.conditionType === conditionType && c.locale === locale,
  )
  if (exactMatch) return exactMatch

  const generalFallback = published.find(
    (c) => c.conditionType === "GENERAL" && c.locale === locale,
  )
  if (generalFallback) return generalFallback

  return published[0]
}

// ---------------------------------------------------------------------------
// BFF aggregation: CareCompanionHome
// ---------------------------------------------------------------------------

/**
 * Aggregates data from multiple fixtures into the BFF response shape.
 * This mirrors what the production BFF endpoint would do on the server.
 */
export function buildCareCompanionHome(): CareCompanionHome {
  const schedules = getRefillSchedules()
  const costSummary = getCostSummary()
  const educationCard = getNextEducationCard()
  const emergencyCard = getMatchedEmergencyCard()
  const transportCredit = getEmergencyTransportCredit()

  // Sort refill schedules by urgency: overdue first, then due, then upcoming
  const statusPriority: Record<string, number> = {
    OVERDUE: 0,
    DUE: 1,
    UPCOMING: 2,
    REFILLED: 3,
  }
  const sorted = [...schedules].sort(
    (a, b) => (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9),
  )

  return {
    refillSchedule: {
      schedules: sorted.slice(0, 3),
      hasMore: sorted.length > 3,
    },
    costSummary: {
      year: costSummary.year,
      ytdSpend: costSummary.ytdSpend,
      monthlyAverage: costSummary.monthlyAverage,
      cashbackEarned: costSummary.cashbackEarned,
      netSpend: costSummary.netSpend,
      annualProjection: costSummary.annualProjection,
      transactionCount: costSummary.transactionCount,
      currency: costSummary.currency,
    },
    educationFeed: educationCard,
    emergencyCard: emergencyCard
      ? {
          conditionType: emergencyCard.conditionType,
          title: emergencyCard.title,
          cardId: emergencyCard.id,
        }
      : null,
    emergencyTransportCredit: transportCredit.isAvailable
      ? transportCredit
      : null,
  }
}

/**
 * Alias for buildCareCompanionHome matching the spec-aligned function
 * name used by the care companion domain API.
 */
export function getCareCompanionHome(): CareCompanionHome {
  return buildCareCompanionHome()
}

// ---------------------------------------------------------------------------
// Care Companion Notifications
// ---------------------------------------------------------------------------

const CC_NOTIFICATIONS_KEY = "care-companion-notifications"

/**
 * Returns all care companion notifications sorted by scheduledAt descending.
 * Optionally filters to unread-only (readAt === null).
 */
export function getCareCompanionNotifications(
  unreadOnly = false,
): CareCompanionNotification[] {
  const all = readCollection<CareCompanionNotification>(
    CC_NOTIFICATIONS_KEY,
    careCompanionNotificationsSeed as unknown as CareCompanionNotification[],
  )

  const filtered = unreadOnly ? all.filter((n) => n.readAt === null) : all

  return [...filtered].sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  )
}

/**
 * Mark a single care companion notification as read by setting readAt to the
 * current ISO timestamp. Returns the updated notification, or undefined if
 * the id was not found.
 */
export function markCareCompanionNotificationRead(
  id: string,
): CareCompanionNotification | undefined {
  const all = readCollection<CareCompanionNotification>(
    CC_NOTIFICATIONS_KEY,
    careCompanionNotificationsSeed as unknown as CareCompanionNotification[],
  )

  const index = all.findIndex((n) => n.id === id)
  if (index === -1) return undefined

  all[index] = { ...all[index], readAt: new Date().toISOString() }
  writeCollection(CC_NOTIFICATIONS_KEY, all)
  return all[index]
}

/**
 * Create a new care companion notification of the given type (dev-only
 * simulate endpoint). Returns the created notification.
 */
export function createCareCompanionNotification(
  type: NotificationType,
): CareCompanionNotification {
  const now = new Date().toISOString()
  const notification: CareCompanionNotification = {
    id: makeId("notif"),
    type,
    title: `Simulated ${type.toLowerCase().replace(/_/g, " ")} notification`,
    body: `This is a simulated ${type} notification created for testing.`,
    deepLink: "/patients/care-companion",
    scheduledAt: now,
    sentAt: now,
    readAt: null,
    metadata: null,
  }

  const all = readCollection<CareCompanionNotification>(
    CC_NOTIFICATIONS_KEY,
    careCompanionNotificationsSeed as unknown as CareCompanionNotification[],
  )
  all.push(notification)
  writeCollection(CC_NOTIFICATIONS_KEY, all)

  return notification
}

// ---------------------------------------------------------------------------
// AI assistant: keyword matching
// ---------------------------------------------------------------------------

interface ConversationEntry {
  sessionId: string
  messages: AssistantMessage[]
}

type ConversationMap = Record<string, ConversationEntry>

/**
 * Match a user message to a canned AI conversation by keyword.
 *
 * Matching rules (per spec Section 4.11):
 * - "cough", "enalapril" -> Margaret's cough conversation
 * - "cook", "dinner", "food", "eat" -> James's dinner conversation
 * - "together", "same time", "both" -> Grace's medication timing conversation
 * - Default -> redirect to doctor/pharmacist
 */
export function matchAssistantResponse(userMessage: string): ConversationEntry {
  const conversations = aiConversationsSeed as unknown as ConversationMap
  const lower = userMessage.toLowerCase()

  // Margaret: cough / enalapril
  if (lower.includes("cough") || lower.includes("enalapril")) {
    return conversations["margaret-cough"]
  }

  // James: cooking / dinner / food / eat
  if (
    lower.includes("cook") ||
    lower.includes("dinner") ||
    lower.includes("food") ||
    lower.includes("eat")
  ) {
    return conversations["james-dinner"]
  }

  // Grace: medication timing
  if (
    lower.includes("together") ||
    lower.includes("same time") ||
    lower.includes("both")
  ) {
    return conversations["grace-timing"]
  }

  // Default: redirect to professional
  return conversations["default-redirect"]
}
