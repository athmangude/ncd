// ---------------------------------------------------------------------------
// Care Companion — TypeScript types
//
// API response shapes for the NCD Care Companion feature set. These map to
// the backend entity column definitions in the technical architecture spec.
// Monetary values are typed as string (Decimal.js serialization). Dates
// arrive as ISO 8601 strings from JSON responses, not Date objects.
//
// @see ncd-care-companion-technical-architecture.md
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Enum const objects — runtime-iterable, with derived union types
// ---------------------------------------------------------------------------

export const MEDICATION_CATEGORY = {
  MEDICATION: "MEDICATION",
  LAB_TEST: "LAB_TEST",
  CONSULTATION: "CONSULTATION",
  SUPPLY: "SUPPLY",
} as const

export type MedicationCategory =
  (typeof MEDICATION_CATEGORY)[keyof typeof MEDICATION_CATEGORY]

export const INVOICE_SOURCE_TYPE = {
  SUBMITTED_INVOICE: "SUBMITTED_INVOICE",
  MEDICAL_INVOICE_ITEM: "MEDICAL_INVOICE_ITEM",
} as const

export type InvoiceSourceType =
  (typeof INVOICE_SOURCE_TYPE)[keyof typeof INVOICE_SOURCE_TYPE]

export const PARSE_METHOD = {
  FUZZY_MATCH: "FUZZY_MATCH",
  NLP: "NLP",
  STRUCTURED_INPUT: "STRUCTURED_INPUT",
  MANUAL: "MANUAL",
} as const

export type ParseMethod = (typeof PARSE_METHOD)[keyof typeof PARSE_METHOD]

export const REVIEW_STATUS = {
  PENDING_REVIEW: "PENDING_REVIEW",
  AUTO_ACCEPTED: "AUTO_ACCEPTED",
  CONFIRMED: "CONFIRMED",
  REJECTED: "REJECTED",
} as const

export type ReviewStatus = (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS]

export const CONDITION_TYPE = {
  HYPERTENSION: "HYPERTENSION",
  DIABETES: "DIABETES",
  GENERAL: "GENERAL",
  ASTHMA: "ASTHMA",
  CANCER: "CANCER",
  KIDNEY_DISEASE: "KIDNEY_DISEASE",
  HEART_DISEASE: "HEART_DISEASE",
  SICKLE_CELL: "SICKLE_CELL",
  HIV_AIDS: "HIV_AIDS",
  EPILEPSY: "EPILEPSY",
  COPD: "COPD",
  ARTHRITIS: "ARTHRITIS",
  MENTAL_HEALTH: "MENTAL_HEALTH",
  THYROID: "THYROID",
  STROKE: "STROKE",
  LIVER_DISEASE: "LIVER_DISEASE",
} as const

export type ConditionType =
  (typeof CONDITION_TYPE)[keyof typeof CONDITION_TYPE]

export const CONTENT_LOCALE = {
  EN: "EN",
  SW: "SW",
} as const

export type ContentLocale =
  (typeof CONTENT_LOCALE)[keyof typeof CONTENT_LOCALE]

export const INTERACTION_SEVERITY = {
  MILD: "MILD",
  MODERATE: "MODERATE",
  SEVERE: "SEVERE",
  CONTRAINDICATED: "CONTRAINDICATED",
} as const

export type InteractionSeverity =
  (typeof INTERACTION_SEVERITY)[keyof typeof INTERACTION_SEVERITY]

export const REFILL_STATUS = {
  UPCOMING: "UPCOMING",
  DUE: "DUE",
  OVERDUE: "OVERDUE",
  REFILLED: "REFILLED",
  CANCELLED: "CANCELLED",
} as const

export type RefillStatus = (typeof REFILL_STATUS)[keyof typeof REFILL_STATUS]

export const EDUCATION_CONTENT_TYPE = {
  DIETARY: "DIETARY",
  EXERCISE: "EXERCISE",
  MYTH_BUSTING: "MYTH_BUSTING",
  EMOTIONAL: "EMOTIONAL",
  SELF_MONITORING: "SELF_MONITORING",
  MILESTONE: "MILESTONE",
  ACCEPTANCE: "ACCEPTANCE",
} as const

export type EducationContentType =
  (typeof EDUCATION_CONTENT_TYPE)[keyof typeof EDUCATION_CONTENT_TYPE]

export const DELIVERY_CHANNEL = {
  PUSH: "PUSH",
  IN_APP: "IN_APP",
  BOTH: "BOTH",
} as const

export type DeliveryChannel =
  (typeof DELIVERY_CHANNEL)[keyof typeof DELIVERY_CHANNEL]

export const NOTIFICATION_TYPE = {
  REFILL_REMINDER: "REFILL_REMINDER",
  REFILL_OVERDUE: "REFILL_OVERDUE",
  REFILL_LOAN_OFFER: "REFILL_LOAN_OFFER",
  PREDICTIVE_CREDIT_OFFER: "PREDICTIVE_CREDIT_OFFER",
  EDUCATION_WEEKLY: "EDUCATION_WEEKLY",
  MEDICATION_CARD_AVAILABLE: "MEDICATION_CARD_AVAILABLE",
  LAB_REMINDER: "LAB_REMINDER",
  AI_INSIGHT: "AI_INSIGHT",
} as const

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]

export const STOCK_STATUS = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const

export type StockStatus = (typeof STOCK_STATUS)[keyof typeof STOCK_STATUS]

export const MEDICATION_LOAN_TRIGGER = {
  PREDICTIVE: "PREDICTIVE",
  OVERDUE_REFILL: "OVERDUE_REFILL",
  PATIENT_REQUESTED: "PATIENT_REQUESTED",
} as const

export type MedicationLoanTrigger =
  (typeof MEDICATION_LOAN_TRIGGER)[keyof typeof MEDICATION_LOAN_TRIGGER]

export const MESSAGE_ROLE = {
  USER: "USER",
  ASSISTANT: "ASSISTANT",
  SYSTEM: "SYSTEM",
} as const

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE]

export const OVERALL_RISK = {
  NONE: "NONE",
  LOW: "LOW",
  MODERATE: "MODERATE",
  HIGH: "HIGH",
} as const

export type OverallRisk = (typeof OVERALL_RISK)[keyof typeof OVERALL_RISK]

export const SUGGESTED_ACTION_TYPE = {
  PAY: "PAY",
  CHECK_STOCK: "CHECK_STOCK",
  APPLY_LOAN: "APPLY_LOAN",
  VIEW_CARD: "VIEW_CARD",
} as const

export type SuggestedActionType =
  (typeof SUGGESTED_ACTION_TYPE)[keyof typeof SUGGESTED_ACTION_TYPE]

// ---------------------------------------------------------------------------
// Sub-types for JSONB fields
// ---------------------------------------------------------------------------

/**
 * A warning symptom entry in an emergency reference card.
 * @see ncd-care-companion-technical-architecture.md EmergencyReferenceCard.warningSymptoms
 */
export interface WarningSymptom {
  symptom: string
  severity: "warning" | "critical"
}

/**
 * An ordered step in emergency immediate actions.
 * @see ncd-care-companion-technical-architecture.md EmergencyReferenceCard.immediateActions
 */
export interface ImmediateAction {
  step: number
  action: string
}

/**
 * A common side effect with frequency and patient advice.
 * @see ncd-care-companion-technical-architecture.md MedicationCard.commonSideEffects
 */
export interface SideEffect {
  effect: string
  frequency: string
  advice: string
}

/**
 * A serious side effect requiring specific action.
 * @see ncd-care-companion-technical-architecture.md MedicationCard.seriousSideEffects
 */
export interface SeriousSideEffect {
  effect: string
  action: string
}

/**
 * A substance the patient should avoid while on a medication.
 * @see ncd-care-companion-technical-architecture.md MedicationCard.avoidanceWarnings
 */
export interface AvoidanceWarning {
  substance: string
  reason: string
}

/**
 * A suggested follow-up action from the AI assistant.
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 5
 */
export interface SuggestedAction {
  type: SuggestedActionType
  label: string
  deepLink: string
}

// ---------------------------------------------------------------------------
// Generic pagination wrapper
// ---------------------------------------------------------------------------

/**
 * Generic wrapper for paginated API responses. Used by medication timeline,
 * cost breakdown, interactions, and other list endpoints.
 *
 * @see ncd-care-companion-technical-architecture.md Section 3 (pagination per B-M5)
 */
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

// ---------------------------------------------------------------------------
// Entity interface 1: MedicationTaxonomyEntry
// ---------------------------------------------------------------------------

/**
 * Canonical medication reference entry from the taxonomy table.
 * Source of truth for name normalization and fuzzy-match resolution.
 * Seeded from pharmaceutical reference data; new entries added via admin
 * tooling, never by patient-facing code.
 *
 * @see ncd-care-companion-technical-architecture.md Section 1 Phase 0
 */
export interface MedicationTaxonomyEntry {
  id: string
  genericName: string
  brandNames: string[] | null
  dosageForms: string[] | null
  strengths: string[] | null
  category: MedicationCategory
  atcCode: string | null
  synonyms: string[] | null
  conditionTags: ConditionType[] | null
  isActive: boolean
}

// ---------------------------------------------------------------------------
// Entity interface 2: ParsedInvoiceLineItem
// ---------------------------------------------------------------------------

/**
 * Structured interpretation of a freetext invoice line item.
 * One ParsedInvoiceLineItem per ServiceLineItem (from SubmittedInvoice)
 * or per MedicalInvoiceItem row. The foundational data layer that the
 * cost tracker, medication timeline, and refill engine build on.
 *
 * @see ncd-care-companion-technical-architecture.md Section 1 Phase 0
 */
export interface ParsedInvoiceLineItem {
  id: string
  sourceType: InvoiceSourceType
  submittedInvoiceId: string | null
  medicalInvoiceItemId: number | null
  sourceLineIndex: number
  patientId: string
  providerId: number
  transactionDate: string
  originalDescription: string
  medicationId: string | null
  parsedDosage: string | null
  parsedQuantity: number | null
  /** Monetary value as string for decimal precision. */
  unitPrice: string | null
  /** Monetary value as string for decimal precision. */
  lineTotal: string
  parsedCategory: MedicationCategory
  confidence: number
  parseMethod: ParseMethod
  reviewStatus: ReviewStatus
  reviewedByUserId: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Entity interface 3: PatientMedicationRecord
// ---------------------------------------------------------------------------

/**
 * Materialized aggregate of a patient's relationship with a specific
 * medication. One row per patient per medication. Updated asynchronously
 * when new ParsedInvoiceLineItem rows are created.
 *
 * The nested medication object is a denormalized subset of the full
 * MedicationTaxonomyEntry, containing only the fields the frontend needs
 * for display in medication lists.
 *
 * @see ncd-care-companion-technical-architecture.md Section 1 Phase 0
 */
export interface PatientMedicationRecord {
  id: string
  medicationId: string
  medication: {
    genericName: string
    brandNames: string[]
    category: MedicationCategory
  }
  firstPurchaseDate: string
  lastPurchaseDate: string
  totalPurchaseCount: number
  averageRefillIntervalDays: number | null
  isActive: boolean
  inferredConditions: string[]
}

// ---------------------------------------------------------------------------
// Entity interface 4: CostSummary
// ---------------------------------------------------------------------------

/**
 * Annual cost summary for a patient. All monetary values are strings
 * because the backend computes them with Decimal.js and serializes to
 * string to avoid floating-point drift.
 *
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 1
 */
export interface CostSummary {
  year: number
  /** Monetary value as string for decimal precision. */
  ytdSpend: string
  /** Monetary value as string for decimal precision. */
  monthlyAverage: string
  /** Monetary value as string for decimal precision. */
  cashbackEarned: string
  /** Monetary value as string for decimal precision. */
  netSpend: string
  /** Monetary value as string for decimal precision. */
  annualProjection: string
  transactionCount: number
  currency: "KES"
}

// ---------------------------------------------------------------------------
// Entity interface 5: CostBreakdownResponse
// ---------------------------------------------------------------------------

/**
 * Spend breakdown for a single category.
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 1
 */
export interface CostCategoryBreakdown {
  category: MedicationCategory
  /** Monetary value as string for decimal precision. */
  totalSpend: string
  percentage: number
  transactionCount: number
}

/**
 * Monthly spend data point used in cost trend charts.
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 1
 */
export interface MonthlySpend {
  month: number
  /** Monetary value as string for decimal precision. */
  spend: string
}

/**
 * Cost breakdown by category with monthly trend data. Includes pagination
 * for the monthly trend array.
 *
 * Response shape for GET /api/patients/:id/cost-summary/breakdown.
 *
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 1
 */
export interface CostBreakdownResponse {
  year: number
  categories: CostCategoryBreakdown[]
  monthlyTrend: MonthlySpend[]
  pagination: {
    total: number
    limit: number
    offset: number
  }
}

// ---------------------------------------------------------------------------
// Entity interface 6: EmergencyReferenceCard
// ---------------------------------------------------------------------------

/**
 * Static, clinician-reviewed emergency content per condition type and locale.
 * Designed for a panicking caregiver needing 60-second guidance. Always
 * accessible after initial load (service worker precached).
 *
 * Includes publishing metadata (version, isPublished) from the entity.
 * Only published cards are returned to patients.
 *
 * @see ncd-care-companion-technical-architecture.md Section 1 Phase 1
 */
export interface EmergencyReferenceCard {
  id: string
  conditionType: ConditionType
  locale: ContentLocale
  title: string
  warningSymptoms: WarningSymptom[]
  immediateActions: ImmediateAction[]
  whenToGoToER: string[]
  doNotDo: string[] | null
  version: number
  isPublished: boolean
}

// ---------------------------------------------------------------------------
// Entity interface 7: MedicationCard
// ---------------------------------------------------------------------------

/**
 * Curated drug intelligence content. One card per medication per locale.
 * Created by pharmacists, reviewed before publishing. Displayed as a
 * post-payment overlay after Jireh Pay transactions.
 *
 * References medication by ID rather than embedding the full taxonomy
 * entry. The frontend resolves the medication name via the taxonomy
 * or PatientMedicationRecord.
 *
 * @see ncd-care-companion-technical-architecture.md Section 1 Phase 2
 */
export interface MedicationCard {
  id: string
  medicationId: string
  locale: ContentLocale
  description: string
  howItWorks: string | null
  commonSideEffects: SideEffect[]
  seriousSideEffects: SeriousSideEffect[]
  avoidanceWarnings: AvoidanceWarning[]
  whenToSeekHelp: string
  storageInstructions: string | null
}

// ---------------------------------------------------------------------------
// Entity interface 8: MedicationInteraction
// ---------------------------------------------------------------------------

/**
 * Known drug-drug and drug-herbal interaction record. Bidirectional:
 * a query for medication A returns interactions where A appears as
 * either medicationAId or medicationBId. The herbName field handles
 * herbal remedies not in the taxonomy.
 *
 * Uses canonical ordering: medicationAId < medicationBId to prevent
 * duplicate (A,B) and (B,A) entries.
 *
 * @see ncd-care-companion-technical-architecture.md Section 1 Phase 2
 */
export interface MedicationInteraction {
  id: string
  medicationAId: string
  medicationBId: string | null
  herbName: string | null
  severity: InteractionSeverity
  descriptionEn: string
  descriptionSw: string | null
  clinicalEffect: string
  recommendation: string
  source: string | null
}

// ---------------------------------------------------------------------------
// Entity interface 9: RefillScheduleItem
// ---------------------------------------------------------------------------

/**
 * Per-patient per-medication refill tracking item.
 * API response shape for GET /api/patients/:id/refill-schedule.
 *
 * Computed from PatientMedicationRecord.averageRefillIntervalDays +
 * lastPurchaseDate. The refill cron updates statuses and triggers
 * notifications.
 *
 * @see ncd-care-companion-technical-architecture.md Section 1 Phase 3
 */
export interface RefillScheduleItem {
  id: string
  medicationName: string
  expectedRefillDate: string
  status: RefillStatus
  /** Negative values indicate overdue days. */
  daysUntilRefill: number
  estimatedDaysSupply: number | null
  escalatedToLoanOffer: boolean
}

// ---------------------------------------------------------------------------
// Entity interface 10: EducationContentCard
// ---------------------------------------------------------------------------

/**
 * Weekly education content card for NCD patients. One card per condition
 * type, locale, and week number in the annual rotation.
 *
 * @see ncd-care-companion-technical-architecture.md Section 1 Phase 3
 */
export interface EducationContentCard {
  id: string
  conditionType: ConditionType
  contentType: EducationContentType
  locale: ContentLocale
  title: string
  body: string
  weekNumber: number
  imageUrl: string | null
  isPublished: boolean
  /** CHP addition: whether the content applies to full households. */
  householdCompatible: boolean | null
  /** CHP addition: whether the advice is cost-neutral to implement. */
  costNeutral: boolean | null
}

// ---------------------------------------------------------------------------
// Entity interface 11: PharmacyStockItem
// ---------------------------------------------------------------------------

/**
 * Pharmacy stock availability for a medication at a specific facility.
 * Response shape for GET /api/pharmacies/stock (nearby stock endpoint).
 *
 * Distance is null when geolocation is unavailable and the fallback
 * path returns all in-network pharmacies sorted alphabetically.
 *
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 4
 */
export interface PharmacyStockItem {
  facility: {
    id: number
    name: string
    lat: number
    lng: number
  }
  distance: number | null
  stockStatus: StockStatus
}

// ---------------------------------------------------------------------------
// Entity interface 12: MedicationLoanPreApproval
// ---------------------------------------------------------------------------

/**
 * Medication loan pre-approval status.
 * Response shape for GET /api/patients/:id/credit/pre-approval.
 *
 * When the patient is not pre-approved, preApprovalDetails is null.
 * All monetary values inside preApprovalDetails are strings for
 * decimal precision.
 *
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 4
 */
export interface MedicationLoanPreApproval {
  isPreApproved: boolean
  preApprovalDetails: {
    /** Monetary value as string for decimal precision. */
    maxAmount: string
    medications: {
      name: string
      /** Monetary value as string for decimal precision. */
      estimatedCost: string
    }[]
    targetPharmacy: {
      id: number
      name: string
    }
    reason: string
    expiresAt: string
  } | null
}

// ---------------------------------------------------------------------------
// Entity interface 13: AiAssistantMessage
// ---------------------------------------------------------------------------

/**
 * AI assistant response message.
 * Response shape for POST /api/patients/:id/assistant/message.
 *
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 5
 */
export interface AiAssistantMessage {
  sessionId: string
  message: {
    content: string
    guardrailFlags: string[]
  }
  suggestedActions: SuggestedAction[]
}

// ---------------------------------------------------------------------------
// Entity interface 14: InteractionCheckResult
// ---------------------------------------------------------------------------

/**
 * Result of checking a product or herbal remedy against the patient's
 * active medications.
 * Response shape for POST /api/patients/:id/assistant/interaction-check.
 *
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 5
 */
export interface InteractionCheckResult {
  productName: string
  interactions: {
    withMedication: string
    severity: InteractionSeverity
    description: string
    recommendation: string
  }[]
  overallRisk: OverallRisk
  disclaimer: string
}

// ---------------------------------------------------------------------------
// Entity interface 15: CareCompanionHomeResponse
// ---------------------------------------------------------------------------

/**
 * Aggregated BFF response for the care companion home page.
 * Single request replaces 4 parallel API calls on 3G networks.
 *
 * Response shape for GET /api/patients/:id/care-companion/home (API-021).
 *
 * @see ncd-care-companion-technical-architecture.md Section 3 BFF Endpoint
 */
export interface CareCompanionHomeResponse {
  refillSchedule: {
    /** Max 3 items, most urgent first. */
    schedules: RefillScheduleItem[]
    hasMore: boolean
  }
  costSummary: CostSummary
  educationFeed: EducationContentCard | null
  emergencyCard: {
    conditionType: ConditionType
    title: string
    cardId: string
  } | null
}

// ---------------------------------------------------------------------------
// Entity interface 16: TimelineEntry
// ---------------------------------------------------------------------------

/**
 * A single entry in the medication purchase timeline. Denormalized from
 * ParsedInvoiceLineItem with facility name and gap analysis.
 *
 * @see ncd-care-companion-technical-architecture.md Section 3 Phase 1b
 */
export interface TimelineEntry {
  date: string
  medicationName: string
  dosage: string | null
  quantity: number | null
  /** Monetary value as string for decimal precision. */
  lineTotal: string
  facilityName: string
  gapDaysFromPrevious: number | null
  /** True when gap exceeds 1.5x the average refill interval. */
  isGapAnomaly: boolean
}

// ---------------------------------------------------------------------------
// Entity interface 17: CareCompanionNotification
// ---------------------------------------------------------------------------

/**
 * Care companion notification delivered via push or in-app feed.
 * Each notification type maps to a specific deep-link route within
 * the care companion section.
 *
 * readAt is null for unread notifications. sentAt is null when the
 * notification is scheduled but not yet delivered. metadata carries
 * type-specific payload (e.g. medication name for refill reminders).
 *
 * @see ncd-care-companion-technical-architecture.md Section 1 Phase 3
 */
export interface CareCompanionNotification {
  id: string
  type: NotificationType
  title: string
  body: string
  deepLink: string
  scheduledAt: string
  sentAt: string | null
  readAt: string | null
  metadata: Record<string, string> | null
}

// ---------------------------------------------------------------------------
// Backward-compatible type aliases
//
// These preserve imports used by existing mock handlers and test files.
// New code should prefer the spec-aligned interfaces above.
// ---------------------------------------------------------------------------

/**
 * Simplified medication reference used by mock fixtures.
 * Subset of MedicationTaxonomyEntry with only the fields needed for
 * display in patient-facing medication lists.
 *
 * @deprecated Prefer MedicationTaxonomyEntry for new code.
 */
export interface Medication {
  id: string
  genericName: string
  brandNames: string[]
  strengths: string[]
  category: MedicationCategory
  conditionTags: ConditionType[]
}

/**
 * Patient medication record using a nested Medication object.
 * Used by existing mock fixtures where the full medication object is
 * inlined rather than referenced by ID.
 *
 * @deprecated Prefer PatientMedicationRecord for new code.
 */
export interface PatientMedication {
  id: string
  medication: Medication
  firstPurchaseDate: string
  lastPurchaseDate: string
  totalPurchaseCount: number
  averageRefillIntervalDays: number | null
  isActive: boolean
  inferredConditions: string[]
}

/**
 * Emergency card with CHP transport credit additions.
 * Used by existing mock fixtures that include the transport credit CTA.
 *
 * @deprecated Prefer EmergencyReferenceCard for new code.
 */
export interface EmergencyCard {
  id: string
  conditionType: ConditionType
  locale: ContentLocale
  title: string
  warningSymptoms: WarningSymptom[]
  immediateActions: ImmediateAction[]
  whenToGoToER: string[]
  doNotDo: string[]
  emergencyTransportCreditAvailable: boolean
  /** Monetary value as string for decimal precision. */
  emergencyTransportCreditAmount: string | null
}

/**
 * Refill schedule item (alias for backward compatibility).
 * @deprecated Prefer RefillScheduleItem for new code.
 */
export type RefillSchedule = RefillScheduleItem

/**
 * Pharmacy stock entry using a flat structure.
 * Used by existing mock fixtures.
 *
 * @deprecated Prefer PharmacyStockItem for new code.
 */
export interface PharmacyStock {
  facilityId: number
  facilityName: string
  medicationName: string
  status: StockStatus
  lastReportedAt: string
  distance: number | null
  lat: number
  lng: number
}

/**
 * AI assistant message using the per-message structure.
 * Used by existing mock fixtures for conversation history.
 *
 * @deprecated Prefer AiAssistantMessage for new code.
 */
export interface AssistantMessage {
  id: string
  role: MessageRole
  content: string
  guardrailFlags: string[]
  suggestedActions: SuggestedAction[]
  timestamp: string
}

/**
 * Emergency transport credit pre-approval.
 * CHP addition (P25.3). Standalone type used by mock fixtures.
 */
export interface EmergencyTransportCredit {
  isAvailable: boolean
  /** Monetary value as string for decimal precision. */
  preApprovedAmount: string
  expiresAt: string
}

/**
 * Care companion home page BFF response with emergency transport credit.
 * Used by existing mock fixtures that include the transport credit field.
 *
 * @deprecated Prefer CareCompanionHomeResponse for new code.
 */
export interface TestScheduleItem {
  id: string
  testName: string
  expectedDate: string
  status: RefillStatus
  daysUntilTest: number
  frequencyMonths: number
}

export interface CareCompanionHome {
  refillSchedule: {
    schedules: RefillScheduleItem[]
    hasMore: boolean
  }
  testSchedule: {
    schedules: TestScheduleItem[]
    hasMore: boolean
  }
  costSummary: CostSummary
  educationFeed: EducationContentCard | null
  emergencyCard: {
    conditionType: string
    title: string
    cardId: string
  } | null
  emergencyTransportCredit: EmergencyTransportCredit | null
}

// ---------------------------------------------------------------------------
// Care Companion Events Log
// ---------------------------------------------------------------------------

export interface RefillScheduleChangeEvent {
  id: string
  type: "REFILL_SCHEDULE_CHANGE"
  timestamp: string
  source: "user" | "system" | "provider"
  scheduleId: string
  medicationName: string
  conditions: string[]
  statusAtChange: RefillStatus
  daysUntilRefillAtChange: number
  previousFrequencyDays: number
  newFrequencyDays: number
  previousNextDate: string
  newNextDate: string
  reason: string
  reasonCategory: string
  estimatedCostPerRefill: number | null
}

export interface TestScheduleChangeEvent {
  id: string
  type: "TEST_SCHEDULE_CHANGE"
  timestamp: string
  source: "user" | "system" | "provider"
  scheduleId: string
  testName: string
  conditions: string[]
  statusAtChange: RefillStatus
  daysUntilTestAtChange: number
  previousFrequencyMonths: number
  newFrequencyMonths: number
  previousNextDate: string
  newNextDate: string
  reason: string
  reasonCategory: string
  estimatedCostPerTest: number | null
}

export interface RefillScheduleRemoveEvent {
  id: string
  type: "REFILL_SCHEDULE_REMOVE"
  timestamp: string
  source: "user" | "system" | "provider"
  scheduleId: string
  medicationName: string
  conditions: string[]
  statusAtChange: RefillStatus
  daysUntilRefillAtChange: number
  reason: string
  reasonCategory: string
  estimatedCostPerRefill: number | null
}

export interface TestScheduleRemoveEvent {
  id: string
  type: "TEST_SCHEDULE_REMOVE"
  timestamp: string
  source: "user" | "system" | "provider"
  scheduleId: string
  testName: string
  conditions: string[]
  statusAtChange: RefillStatus
  daysUntilTestAtChange: number
  reason: string
  reasonCategory: string
  estimatedCostPerTest: number | null
}

// ---------------------------------------------------------------------------
// Payment & Cashback Events
// ---------------------------------------------------------------------------

export interface PaymentEvent {
  id: string
  type: "PAYMENT"
  timestamp: string
  source: "user"
  facilityName: string
  facilityType: "PHARMACY" | "LAB" | "HOSPITAL" | "CLINIC"
  totalAmount: number
  currency: "KES"
  lineItems: {
    name: string
    category: "MEDICATION" | "LAB_TEST" | "CONSULTATION" | "SUPPLY"
    quantity: number
    unitPrice: number
    lineTotal: number
  }[]
  fundingSources: {
    type: "WALLET" | "MPESA" | "CASHBACK" | "LOAN" | "CARE_SAVER"
    amount: number
  }[]
  isInNetwork: boolean
}

export interface CashbackEarnedEvent {
  id: string
  type: "CASHBACK_EARNED"
  timestamp: string
  source: "system"
  paymentEventId: string
  amount: number
  currency: "KES"
  rate: number
  newBalance: number
}

// ---------------------------------------------------------------------------
// Circle Membership Events
// ---------------------------------------------------------------------------

export interface CircleInviteSentEvent {
  id: string
  type: "CIRCLE_INVITE_SENT"
  timestamp: string
  source: "user"
  inviteeFirstName: string
  inviteeLastName: string
  inviteePhone: string
  relationship: string
  slotType: "ACCOUNTABLE" | "AUXILIARY"
}

export interface CircleInviteAcceptedEvent {
  id: string
  type: "CIRCLE_INVITE_ACCEPTED"
  timestamp: string
  source: "system" | "llm"
  memberId: string
  memberFirstName: string
  memberLastName: string
  relationship: string
  slotType: "ACCOUNTABLE" | "AUXILIARY"
}

export interface CashbackSharedEvent {
  id: string
  type: "CASHBACK_SHARED"
  timestamp: string
  source: "user" | "system"
  recipientMemberId: string
  recipientName: string
  amount: number
  currency: "KES"
  reason: string | null
}

// ---------------------------------------------------------------------------
// Drug Interaction & Jireh Plus Events
// ---------------------------------------------------------------------------

export interface DrugInteractionDetectedEvent {
  id: string
  type: "DRUG_INTERACTION_DETECTED"
  timestamp: string
  source: "system"
  medicationA: string
  medicationB: string | null
  herbName: string | null
  severity: InteractionSeverity
  clinicalEffect: string
  recommendation: string
}

export interface JirehPlusStatusChangeEvent {
  id: string
  type: "JIREH_PLUS_STATUS_CHANGE"
  timestamp: string
  source: "user" | "system"
  newStatus: "ACTIVE" | "INACTIVE"
  previousStatus: "ACTIVE" | "INACTIVE" | null
}

// ---------------------------------------------------------------------------
// Loan Events
// ---------------------------------------------------------------------------

export interface LoanDisbursedEvent {
  id: string
  type: "LOAN_DISBURSED"
  timestamp: string
  source: "user"
  loanId: string
  amount: number
  currency: "KES"
  purpose: string
  targetFacility: string
  medications: string[]
  repaymentSchedule: {
    totalRepayments: number
    amountPerRepayment: number
    cadence: "DAILY" | "WEEKLY" | "MONTHLY"
    firstDueDate: string
  }
}

export interface LoanRepaymentEvent {
  id: string
  type: "LOAN_REPAYMENT"
  timestamp: string
  source: "user"
  loanId: string
  amount: number
  currency: "KES"
  method: "MPESA" | "M_RATIBA" | "MANUAL"
  outstandingBalance: number
  isOnTime: boolean
  repaymentNumber: number
  totalRepayments: number
}

export interface LoanOverdueEvent {
  id: string
  type: "LOAN_OVERDUE"
  timestamp: string
  source: "system"
  loanId: string
  daysOverdue: number
  outstandingBalance: number
  nextDeductionDate: string | null
}

// ---------------------------------------------------------------------------
// LLM Action Events (AI pipeline output)
// ---------------------------------------------------------------------------

export const LLM_ACTION_TYPE = {
  REFILL_NUDGE: "REFILL_NUDGE",
  MISSED_TEST_FLAG: "MISSED_TEST_FLAG",
  COST_SAVING_SUGGESTION: "COST_SAVING_SUGGESTION",
  DRUG_INTERACTION_WARNING: "DRUG_INTERACTION_WARNING",
  PROVIDER_FLAG: "PROVIDER_FLAG",
  ADHERENCE_PATTERN: "ADHERENCE_PATTERN",
  CIRCLE_PROMPT: "CIRCLE_PROMPT",
  INVOICE_POPULATE: "INVOICE_POPULATE",
  DRUG_INFO_SURFACE: "DRUG_INFO_SURFACE",
  TEST_RESULT_PROMPT: "TEST_RESULT_PROMPT",
  LOAN_REPAYMENT_PRAISE: "LOAN_REPAYMENT_PRAISE",
  LOAN_REPAYMENT_REMINDER: "LOAN_REPAYMENT_REMINDER",
  LOAN_REPAYMENT_OVERDUE: "LOAN_REPAYMENT_OVERDUE",
  LOAN_OFFER: "LOAN_OFFER",
  JIREH_PLUS_RECOMMEND: "JIREH_PLUS_RECOMMEND",
  NO_ACTION: "NO_ACTION",
} as const

export type LlmActionType =
  (typeof LLM_ACTION_TYPE)[keyof typeof LLM_ACTION_TYPE]

export interface LlmActionEvent {
  id: string
  type: "LLM_ACTION"
  timestamp: string
  source: "llm"
  actionType: LlmActionType
  title: string
  body: string
  severity: "INFO" | "WARNING" | "CRITICAL"
  relatedMedication: string | null
  relatedScheduleId: string | null
  inputHash: string
  dismissed: boolean
  invoiceLineItems?: {
    name: string
    category: "MEDICATION" | "LAB_TEST" | "CONSULTATION" | "SUPPLY" | "OTHER"
    quantity: number
    unitPrice: number
    lineTotal: number
  }[]
}

// ---------------------------------------------------------------------------
// Union of all event types
// ---------------------------------------------------------------------------

export type CareCompanionEvent =
  | RefillScheduleChangeEvent
  | TestScheduleChangeEvent
  | RefillScheduleRemoveEvent
  | TestScheduleRemoveEvent
  | PaymentEvent
  | CashbackEarnedEvent
  | CircleInviteSentEvent
  | CircleInviteAcceptedEvent
  | CashbackSharedEvent
  | DrugInteractionDetectedEvent
  | JirehPlusStatusChangeEvent
  | LoanDisbursedEvent
  | LoanRepaymentEvent
  | LoanOverdueEvent
  | LlmActionEvent

export type CareCompanionEventType = CareCompanionEvent["type"]

// ---------------------------------------------------------------------------
// Care Companion Profile (intake questionnaire responses)
// ---------------------------------------------------------------------------

/**
 * Full care companion profile from the intake questionnaire.
 * Six branching steps that personalize the companion experience.
 *
 * @see NCD Patient Care Companion.md Section 4.1
 */
export interface CareCompanionProfile {
  id: string
  completedAt: string | null
  skippedAt: string | null

  /** Step 1: Conditions the patient is managing. */
  conditions: {
    type: (
      | "DIABETES"
      | "HYPERTENSION"
      | "ASTHMA"
      | "CANCER"
      | "KIDNEY_DISEASE"
      | "HEART_DISEASE"
      | "SICKLE_CELL"
      | "HIV_AIDS"
      | "EPILEPSY"
      | "COPD"
      | "ARTHRITIS"
      | "MENTAL_HEALTH"
      | "THYROID"
      | "STROKE"
      | "LIVER_DISEASE"
      | "OTHER"
    )[]
    otherDescription: string | null
    diagnosisRecency:
      | "LESS_THAN_6_MONTHS"
      | "6_MONTHS_TO_2_YEARS"
      | "MORE_THAN_2_YEARS"
      | null
  }

  /** Step 2: Current treatment (branched by condition). */
  treatment: {
    currentlyOnMedication: boolean
    medicationNames: string[]
    takingMedicationRegularly:
      | "ALWAYS"
      | "MOSTLY"
      | "SOMETIMES"
      | "RARELY"
      | null
    reasonsForMissing: (
      | "COST"
      | "FORGOT"
      | "SIDE_EFFECTS"
      | "FEEL_FINE"
      | "STOCK_OUT"
      | "OTHER"
    )[]
    usingHerbalAlternatives: boolean
    herbalDetails: string | null
  }

  /** Step 3: Biggest challenges (multi-select, ranked). */
  challenges: {
    selected: (
      | "COST"
      | "UNDERSTANDING_MEDICATION"
      | "DIET"
      | "EXERCISE"
      | "SIDE_EFFECTS"
      | "FINDING_PHARMACY"
      | "EMOTIONAL"
      | "FAMILY_SUPPORT"
      | "EMERGENCY_PREPAREDNESS"
      | "NAVIGATING_SYSTEM"
      | "STIGMA"
    )[]
    topChallenge: string | null
  }

  /** Step 4: How they currently cope (branched by challenges). */
  coping: {
    costCoping:
      | (
          | "BORROW_FAMILY"
          | "SKIP_DOSES"
          | "CHEAPER_ALTERNATIVES"
          | "SELL_ASSETS"
          | "FUNDRAISE"
          | "NOTHING"
          | "OTHER"
        )[]
      | null
    informationSources: (
      | "DOCTOR"
      | "PHARMACIST"
      | "WHATSAPP"
      | "INTERNET"
      | "FAMILY"
      | "CHP"
      | "TRADITIONAL_HEALER"
      | "NONE"
    )[]
    hasEmergencyPlan: boolean | null
    exerciseFrequency:
      | "DAILY"
      | "FEW_TIMES_WEEK"
      | "RARELY"
      | "NEVER"
      | null
  }

  /** Step 5: What they want from the companion. */
  goals: {
    selected: (
      | "TRACK_COSTS"
      | "MEDICATION_REMINDERS"
      | "UNDERSTAND_MEDICATION"
      | "FIND_AFFORDABLE_PHARMACY"
      | "EMERGENCY_HELP"
      | "DIET_TIPS"
      | "EXERCISE_GUIDANCE"
      | "EMOTIONAL_SUPPORT"
      | "CREDIT_FOR_MEDICATION"
      | "SHARE_WITH_FAMILY"
    )[]
  }

  /** Step 2b: Recurring medical tests the patient takes. */
  recurringTests: {
    selectedTests: string[]
  }

  /** Step 3: Cost estimation for medications and tests. */
  costEstimates: {
    medications: {
      name: string
      refillFrequencyDays: number
      estimatedCostPerRefill: number
    }[]
    tests: {
      name: string
      frequencyMonths: number
      estimatedCostPerTest: number
    }[]
  }

  /** Step 8: Relationship to patient (addresses H11.0). */
  userRole: {
    role: "SELF" | "CAREGIVER" | "BOTH"
    patientRelationship:
      | "SPOUSE"
      | "PARENT"
      | "CHILD"
      | "SIBLING"
      | "OTHER"
      | null
  }

  /** Extended profile data beyond intake (populated from account state). */
  accountData: {
    cashbackBalance: number
    jirehPlusStatus: "ACTIVE" | "INACTIVE" | "TRIAL"
    jirehPlusSince: string | null
    circleMembers: {
      id: string
      firstName: string
      lastName: string
      relationship: string
      status: "ACTIVE" | "PENDING" | "REJECTED"
      slotType: "ACCOUNTABLE" | "AUXILIARY"
      joinedAt: string | null
    }[]
    totalCashbackEarned: number
    totalCashbackShared: number
    projectedMonthlyCosts: {
      month: string
      medications: number
      tests: number
      consultations: number
      total: number
    }[]
    activeLoan: {
      loanId: string
      originalAmount: number
      outstandingBalance: number
      nextRepaymentDate: string
      nextRepaymentAmount: number
      repaymentsCompleted: number
      totalRepayments: number
      isOverdue: boolean
    } | null
    creditLimit: number
    repaymentStreak: number
    totalLoansCompleted: number
  } | null
}
