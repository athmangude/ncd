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

import { readObject, writeObject, patchObject, readCollection } from "../db"

import type {
  CareCompanionProfile,
  CareCompanionHome,
  CostSummary,
  CostCategoryBreakdown,
  RefillSchedule,
  EducationContentCard,
  EmergencyCard,
  EmergencyTransportCredit,
  PatientMedication,
  TimelineEntry,
  MedicationCard,
  MedicationInteraction,
  PharmacyStock,
  MedicationLoanPreApproval,
  AssistantMessage,
} from "@/types/care-companion"

import patientMedicationsSeed from "../fixtures/patient-medications.json"
import medicationTimelineSeed from "../fixtures/medication-timeline.json"
import costSummarySeed from "../fixtures/cost-summary.json"
import emergencyCardsSeed from "../fixtures/emergency-cards.json"
import medicationCardsSeed from "../fixtures/medication-cards.json"
import medicationInteractionsSeed from "../fixtures/medication-interactions.json"
import refillSchedulesSeed from "../fixtures/refill-schedules.json"
import educationCardsSeed from "../fixtures/education-cards.json"
import pharmacyStockSeed from "../fixtures/pharmacy-stock.json"
import medicationLoanPreapprovalSeed from "../fixtures/medication-loan-preapproval.json"
import emergencyTransportCreditSeed from "../fixtures/emergency-transport-credit.json"
import aiConversationsSeed from "../fixtures/ai-assistant-conversations.json"
import careCompanionProfileSeed from "../fixtures/care-companion-profile.json"

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

interface CostSummaryFixture extends CostSummary {
  breakdown: CostCategoryBreakdown[]
  monthlyTrend: { month: number; spend: string }[]
}

export function getCostSummary(): CostSummaryFixture {
  return readObject<CostSummaryFixture>(
    COST_SUMMARY_KEY,
    costSummarySeed as unknown as CostSummaryFixture,
  )
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

export function getEducationCards(): EducationContentCard[] {
  return readCollection<EducationContentCard>(
    EDUCATION_CARDS_KEY,
    educationCardsSeed as unknown as EducationContentCard[],
  )
}

export function getPharmacyStock(): PharmacyStock[] {
  return readCollection<PharmacyStock>(
    PHARMACY_STOCK_KEY,
    pharmacyStockSeed as unknown as PharmacyStock[],
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
// Education feed: next unviewed card
// ---------------------------------------------------------------------------

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
