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

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

// Medication taxonomy (simplified from MedicationTaxonomyEntry)
export interface Medication {
  id: string
  genericName: string
  brandNames: string[]
  strengths: string[]
  category: MedicationCategory
  conditionTags: ConditionType[]
}

// Patient's relationship with a medication (from PatientMedicationRecord)
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

// Medication timeline entry (from ParsedInvoiceLineItem, denormalized)
export interface TimelineEntry {
  date: string
  medicationName: string
  dosage: string | null
  quantity: number | null
  lineTotal: string
  facilityName: string
  gapDaysFromPrevious: number | null
  isGapAnomaly: boolean
}

// Cost tracker
export interface CostSummary {
  year: number
  ytdSpend: string
  monthlyAverage: string
  cashbackEarned: string
  netSpend: string
  annualProjection: string
  transactionCount: number
  currency: "KES"
}

export interface CostCategoryBreakdown {
  category: MedicationCategory
  totalSpend: string
  percentage: number
  transactionCount: number
}

// Emergency card
export interface EmergencyCard {
  id: string
  conditionType: ConditionType
  locale: ContentLocale
  title: string
  warningSymptoms: { symptom: string; severity: "warning" | "critical" }[]
  immediateActions: { step: number; action: string }[]
  whenToGoToER: string[]
  doNotDo: string[]
  // CHP addition: emergency transport credit CTA
  emergencyTransportCreditAvailable: boolean
  emergencyTransportCreditAmount: string | null
}

// Medication intelligence card
export interface MedicationCard {
  id: string
  medication: Medication
  locale: ContentLocale
  description: string
  howItWorks: string | null
  commonSideEffects: { effect: string; frequency: string; advice: string }[]
  seriousSideEffects: { effect: string; action: string }[]
  avoidanceWarnings: { substance: string; reason: string }[]
  whenToSeekHelp: string
}

export interface MedicationInteraction {
  id: string
  medicationA: string
  medicationB: string | null
  herbName: string | null
  severity: InteractionSeverity
  description: string
  clinicalEffect: string
  recommendation: string
}

// Refill schedule
export interface RefillSchedule {
  id: string
  medicationName: string
  expectedRefillDate: string
  status: RefillStatus
  daysUntilRefill: number
  estimatedDaysSupply: number | null
  escalatedToLoanOffer: boolean
}

// Education content
export interface EducationContentCard {
  id: string
  conditionType: ConditionType
  contentType: EducationContentType
  locale: ContentLocale
  title: string
  body: string
  weekNumber: number
  // CHP addition: household compatibility metadata
  householdCompatible: boolean | null
  costNeutral: boolean | null
}

// Pharmacy stock
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

// Medication loan pre-approval
export interface MedicationLoanPreApproval {
  isPreApproved: boolean
  maxAmount: string
  medications: { name: string; estimatedCost: string }[]
  targetPharmacy: { id: number; name: string }
  reason: string
  expiresAt: string
}

// Emergency transport credit (CHP addition: P25.3)
export interface EmergencyTransportCredit {
  isAvailable: boolean
  preApprovedAmount: string
  expiresAt: string
}

// AI assistant
export interface AssistantMessage {
  id: string
  role: MessageRole
  content: string
  guardrailFlags: string[]
  suggestedActions: {
    type: "PAY" | "CHECK_STOCK" | "APPLY_LOAN" | "VIEW_CARD"
    label: string
    deepLink: string
  }[]
  timestamp: string
}

// Care companion home (BFF shape)
export interface CareCompanionHome {
  refillSchedule: {
    schedules: RefillSchedule[]
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

// Care companion profile (intake questionnaire responses)
export interface CareCompanionProfile {
  id: string
  completedAt: string | null
  skippedAt: string | null

  // Step 1: Conditions
  conditions: {
    type: (
      | "DIABETES"
      | "HYPERTENSION"
      | "ASTHMA"
      | "CANCER"
      | "KIDNEY_DISEASE"
      | "HEART_DISEASE"
      | "SICKLE_CELL"
      | "OTHER"
    )[]
    otherDescription: string | null
    diagnosisRecency:
      | "LESS_THAN_6_MONTHS"
      | "6_MONTHS_TO_2_YEARS"
      | "MORE_THAN_2_YEARS"
      | null
  }

  // Step 2: Current treatment (branched by condition)
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

  // Step 3: Biggest challenges (multi-select, ranked)
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

  // Step 4: How they currently cope (branched by challenges)
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

  // Step 5: What they want from the companion
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

  // Step 6: Relationship to patient (branched, addresses H11.0)
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
}
