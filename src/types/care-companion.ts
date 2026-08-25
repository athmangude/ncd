// Medication taxonomy (simplified from MedicationTaxonomyEntry)
export interface Medication {
  id: string
  genericName: string
  brandNames: string[]
  strengths: string[]
  category: "MEDICATION" | "LAB_TEST" | "CONSULTATION" | "SUPPLY"
  conditionTags: ("HYPERTENSION" | "DIABETES" | "GENERAL")[]
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
  category: "MEDICATION" | "LAB_TEST" | "CONSULTATION" | "SUPPLY"
  totalSpend: string
  percentage: number
  transactionCount: number
}

// Emergency card
export interface EmergencyCard {
  id: string
  conditionType: "HYPERTENSION" | "DIABETES" | "GENERAL"
  locale: "EN" | "SW"
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
  locale: "EN" | "SW"
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
  severity: "MILD" | "MODERATE" | "SEVERE" | "CONTRAINDICATED"
  description: string
  clinicalEffect: string
  recommendation: string
}

// Refill schedule
export interface RefillSchedule {
  id: string
  medicationName: string
  expectedRefillDate: string
  status: "UPCOMING" | "DUE" | "OVERDUE" | "REFILLED"
  daysUntilRefill: number
  estimatedDaysSupply: number | null
  escalatedToLoanOffer: boolean
}

// Education content
export type EducationContentType =
  | "DIETARY"
  | "EXERCISE"
  | "MYTH_BUSTING"
  | "EMOTIONAL"
  | "SELF_MONITORING"
  | "MILESTONE"
  | "ACCEPTANCE"

export interface EducationContentCard {
  id: string
  conditionType: "HYPERTENSION" | "DIABETES" | "GENERAL"
  contentType: EducationContentType
  locale: "EN" | "SW"
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
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK"
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
  role: "USER" | "ASSISTANT" | "SYSTEM"
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
