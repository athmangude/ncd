import { describe, it, expect } from "vitest"
import {
  MEDICATION_CATEGORY,
  INVOICE_SOURCE_TYPE,
  PARSE_METHOD,
  REVIEW_STATUS,
  CONDITION_TYPE,
  CONTENT_LOCALE,
  INTERACTION_SEVERITY,
  REFILL_STATUS,
  EDUCATION_CONTENT_TYPE,
  DELIVERY_CHANNEL,
  STOCK_STATUS,
  MEDICATION_LOAN_TRIGGER,
  MESSAGE_ROLE,
  OVERALL_RISK,
  SUGGESTED_ACTION_TYPE,
} from "./care-companion"
import type {
  Medication,
  PatientMedication,
  TimelineEntry,
  CostSummary,
  CostCategoryBreakdown,
  EmergencyCard,
  MedicationCard,
  MedicationInteraction,
  RefillSchedule,
  EducationContentType,
  EducationContentCard,
  PharmacyStock,
  MedicationLoanPreApproval,
  EmergencyTransportCredit,
  AssistantMessage,
  CareCompanionHome,
  CareCompanionProfile,
  MedicationCategory,
  InvoiceSourceType,
  ParseMethod,
  ReviewStatus,
  ConditionType,
  ContentLocale,
  InteractionSeverity,
  RefillStatus,
  DeliveryChannel,
  StockStatus,
  MedicationLoanTrigger,
  MessageRole,
  OverallRisk,
  SuggestedActionType,
  // New spec-aligned types
  MedicationTaxonomyEntry,
  ParsedInvoiceLineItem,
  PatientMedicationRecord,
  CostBreakdownResponse,
  MonthlySpend,
  EmergencyReferenceCard,
  RefillScheduleItem,
  PharmacyStockItem,
  AiAssistantMessage,
  InteractionCheckResult,
  CareCompanionHomeResponse,
  PaginatedResponse,
  // Sub-types
  WarningSymptom,
  ImmediateAction,
} from "./care-companion"

// ---------------------------------------------------------------------------
// Fixtures — realistic data modelled after what the Jireh backend returns.
// Each fixture doubles as a compile-time check (TS rejects non-conforming
// shapes) and a runtime check (we assert on key structural properties).
// ---------------------------------------------------------------------------

// -- Backward-compatible types (used by existing mocks) --------------------

const medication: Medication = {
  id: "med-001",
  genericName: "Metformin",
  brandNames: ["Glucophage", "Glycomet"],
  strengths: ["500mg", "850mg", "1000mg"],
  category: "MEDICATION",
  conditionTags: ["DIABETES"],
}

const patientMedication: PatientMedication = {
  id: "pm-001",
  medication,
  firstPurchaseDate: "2025-03-15T00:00:00Z",
  lastPurchaseDate: "2026-08-01T00:00:00Z",
  totalPurchaseCount: 18,
  averageRefillIntervalDays: 30,
  isActive: true,
  inferredConditions: ["DIABETES"],
}

const timelineEntry: TimelineEntry = {
  date: "2026-08-01T00:00:00Z",
  medicationName: "Metformin 500mg",
  dosage: "500mg twice daily",
  quantity: 60,
  lineTotal: "450.00",
  facilityName: "Nairobi Hospital Pharmacy",
  gapDaysFromPrevious: 28,
  isGapAnomaly: false,
}

const costSummary: CostSummary = {
  year: 2026,
  ytdSpend: "32400.00",
  monthlyAverage: "4050.00",
  cashbackEarned: "1620.00",
  netSpend: "30780.00",
  annualProjection: "48600.00",
  transactionCount: 24,
  currency: "KES",
}

const costCategoryBreakdown: CostCategoryBreakdown = {
  category: "MEDICATION",
  totalSpend: "28000.00",
  percentage: 86.4,
  transactionCount: 18,
}

const emergencyCard: EmergencyCard = {
  id: "ec-hyp-en",
  conditionType: "HYPERTENSION",
  locale: "EN",
  title: "Hypertension Emergency Card",
  warningSymptoms: [
    { symptom: "Severe headache", severity: "warning" },
    { symptom: "Chest pain", severity: "critical" },
  ],
  immediateActions: [
    { step: 1, action: "Sit down and rest" },
    { step: 2, action: "Take prescribed emergency medication" },
  ],
  whenToGoToER: ["Blood pressure above 180/120", "Loss of consciousness"],
  doNotDo: ["Do not drive yourself", "Do not ignore symptoms"],
  emergencyTransportCreditAvailable: true,
  emergencyTransportCreditAmount: "2000.00",
}

const medicationCard: MedicationCard = {
  id: "mc-metformin-en",
  medicationId: "med-001",
  locale: "EN",
  description: "Metformin helps control blood sugar levels in type 2 diabetes.",
  howItWorks: "Decreases glucose production in the liver.",
  commonSideEffects: [
    {
      effect: "Nausea",
      frequency: "Common in first weeks",
      advice: "Take with food",
    },
  ],
  seriousSideEffects: [
    { effect: "Lactic acidosis", action: "Seek emergency care immediately" },
  ],
  avoidanceWarnings: [
    { substance: "Alcohol", reason: "Increases risk of lactic acidosis" },
  ],
  whenToSeekHelp:
    "If you experience severe nausea, vomiting, or unusual fatigue",
  storageInstructions: "Store below 25C in a dry place",
}

const medicationInteraction: MedicationInteraction = {
  id: "mi-001",
  medicationAId: "med-001",
  medicationBId: "med-002",
  herbName: null,
  severity: "MILD",
  descriptionEn: "Minor interaction between Metformin and Lisinopril.",
  descriptionSw: null,
  clinicalEffect: "May slightly increase hypoglycemia risk.",
  recommendation: "Monitor blood sugar more frequently.",
  source: "BNF Kenya 2025",
}

const refillSchedule: RefillSchedule = {
  id: "rs-001",
  medicationName: "Metformin 500mg",
  expectedRefillDate: "2026-09-01T00:00:00Z",
  status: "UPCOMING",
  daysUntilRefill: 7,
  estimatedDaysSupply: 30,
  escalatedToLoanOffer: false,
}

const educationContentCard: EducationContentCard = {
  id: "edu-001",
  conditionType: "DIABETES",
  contentType: "DIETARY",
  locale: "EN",
  title: "Understanding Carbohydrates",
  body: "Carbohydrates have the greatest effect on blood sugar...",
  weekNumber: 3,
  imageUrl: null,
  isPublished: true,
  householdCompatible: true,
  costNeutral: null,
}

const pharmacyStock: PharmacyStock = {
  facilityId: 42,
  facilityName: "MedPlus Pharmacy Westlands",
  medicationName: "Metformin 500mg",
  status: "IN_STOCK",
  lastReportedAt: "2026-08-25T10:00:00Z",
  distance: 2.3,
  lat: -1.2635,
  lng: 36.8038,
}

const medicationLoanPreApproval: MedicationLoanPreApproval = {
  isPreApproved: true,
  preApprovalDetails: {
    maxAmount: "5000.00",
    medications: [{ name: "Metformin 500mg", estimatedCost: "450.00" }],
    targetPharmacy: { id: 42, name: "MedPlus Pharmacy Westlands" },
    reason: "Good repayment history and active savings.",
    expiresAt: "2026-09-25T00:00:00Z",
  },
}

const emergencyTransportCredit: EmergencyTransportCredit = {
  isAvailable: true,
  preApprovedAmount: "2000.00",
  expiresAt: "2026-12-31T23:59:59Z",
}

const assistantMessage: AssistantMessage = {
  id: "msg-001",
  role: "ASSISTANT",
  content: "Your Metformin refill is due in 7 days.",
  guardrailFlags: [],
  suggestedActions: [
    {
      type: "CHECK_STOCK",
      label: "Check pharmacy stock",
      deepLink: "/care-companion/pharmacy-stock/metformin",
    },
  ],
  timestamp: "2026-08-25T08:30:00Z",
}

const careCompanionHome: CareCompanionHome = {
  refillSchedule: {
    schedules: [refillSchedule],
    hasMore: false,
  },
  testSchedule: {
    schedules: [],
    hasMore: false,
  },
  costSummary,
  educationFeed: educationContentCard,
  emergencyCard: {
    conditionType: "HYPERTENSION",
    title: "Hypertension Emergency Card",
    cardId: "ec-hyp-en",
  },
  emergencyTransportCredit,
}

const careCompanionProfile: CareCompanionProfile = {
  id: "profile-001",
  completedAt: "2026-08-20T14:00:00Z",
  skippedAt: null,
  conditions: {
    type: ["DIABETES", "HYPERTENSION"],
    otherDescription: null,
    diagnosisRecency: "MORE_THAN_2_YEARS",
  },
  treatment: {
    currentlyOnMedication: true,
    medicationNames: ["Metformin", "Lisinopril"],
    takingMedicationRegularly: "MOSTLY",
    reasonsForMissing: ["COST", "FORGOT"],
    usingHerbalAlternatives: false,
    herbalDetails: null,
  },
  challenges: {
    selected: ["COST", "DIET", "EMOTIONAL"],
    topChallenge: "COST",
  },
  coping: {
    costCoping: ["BORROW_FAMILY", "CHEAPER_ALTERNATIVES"],
    informationSources: ["DOCTOR", "INTERNET"],
    hasEmergencyPlan: false,
    exerciseFrequency: "RARELY",
  },
  goals: {
    selected: [
      "TRACK_COSTS",
      "MEDICATION_REMINDERS",
      "FIND_AFFORDABLE_PHARMACY",
    ],
  },
  userRole: {
    role: "CAREGIVER",
    patientRelationship: "PARENT",
  },
  recurringTests: {
    selectedTests: ["HbA1c", "Lipid Panel"],
  },
  costEstimates: {
    medications: [
      { name: "Metformin", refillFrequencyDays: 30, estimatedCostPerRefill: 450 },
    ],
    tests: [
      { name: "HbA1c", frequencyMonths: 3, estimatedCostPerTest: 1500 },
    ],
  },
  accountData: null,
}

// -- New spec-aligned types ------------------------------------------------

const taxonomyEntry: MedicationTaxonomyEntry = {
  id: "mte-001",
  genericName: "Metformin",
  brandNames: ["Glucophage", "Glycomet", "Dianben"],
  dosageForms: ["tablet", "injection"],
  strengths: ["500mg", "850mg", "1000mg"],
  category: "MEDICATION",
  atcCode: "A10BA02",
  synonyms: ["metfoming", "metformine"],
  conditionTags: ["DIABETES"],
  isActive: true,
}

const parsedLineItem: ParsedInvoiceLineItem = {
  id: "pili-001",
  sourceType: "SUBMITTED_INVOICE",
  submittedInvoiceId: "inv-001",
  medicalInvoiceItemId: null,
  sourceLineIndex: 0,
  patientId: "patient-001",
  providerId: 42,
  transactionDate: "2026-08-01",
  originalDescription: "Metformin 500mg x60",
  medicationId: "mte-001",
  parsedDosage: "500mg",
  parsedQuantity: 60,
  unitPrice: "7.50",
  lineTotal: "450.00",
  parsedCategory: "MEDICATION",
  confidence: 0.95,
  parseMethod: "FUZZY_MATCH",
  reviewStatus: "AUTO_ACCEPTED",
  reviewedByUserId: null,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
}

const patientMedicationRecord: PatientMedicationRecord = {
  id: "pmr-001",
  medicationId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  medication: {
    genericName: "Metformin",
    brandNames: ["Glucophage", "Glycomet"],
    category: "MEDICATION",
  },
  firstPurchaseDate: "2025-03-15",
  lastPurchaseDate: "2026-08-01",
  totalPurchaseCount: 18,
  averageRefillIntervalDays: 30,
  isActive: true,
  inferredConditions: ["DIABETES"],
}

const costBreakdown: CostBreakdownResponse = {
  year: 2026,
  categories: [costCategoryBreakdown],
  monthlyTrend: [
    { month: 1, spend: "3200.00" },
    { month: 2, spend: "4100.00" },
  ],
  pagination: { total: 8, limit: 12, offset: 0 },
}

const emergencyRefCard: EmergencyReferenceCard = {
  id: "erc-hyp-en",
  conditionType: "HYPERTENSION",
  locale: "EN",
  title: "Hypertension Emergency Guide",
  warningSymptoms: [
    { symptom: "Severe headache", severity: "warning" },
    { symptom: "Chest pain", severity: "critical" },
  ],
  immediateActions: [
    { step: 1, action: "Sit down and rest" },
    { step: 2, action: "Take prescribed emergency medication" },
  ],
  whenToGoToER: ["Blood pressure above 180/120"],
  doNotDo: ["Do not drive yourself"],
  version: 2,
  isPublished: true,
}

const refillItem: RefillScheduleItem = {
  id: "rsi-001",
  medicationName: "Metformin 500mg",
  expectedRefillDate: "2026-09-01",
  status: "UPCOMING",
  daysUntilRefill: 7,
  estimatedDaysSupply: 30,
  escalatedToLoanOffer: false,
}

const stockItem: PharmacyStockItem = {
  facility: {
    id: 42,
    name: "MedPlus Pharmacy Westlands",
    lat: -1.2635,
    lng: 36.8038,
  },
  distance: 2.3,
  stockStatus: "IN_STOCK",
}

const aiMessage: AiAssistantMessage = {
  sessionId: "session-001",
  message: {
    content: "Your Metformin refill is due in 7 days.",
    guardrailFlags: ["disclaimer_shown"],
  },
  suggestedActions: [
    {
      type: "CHECK_STOCK",
      label: "Check pharmacy stock",
      deepLink: "/care-companion/pharmacy-stock/metformin",
    },
  ],
}

const interactionCheck: InteractionCheckResult = {
  productName: "St. John's Wort",
  interactions: [
    {
      withMedication: "Metformin",
      severity: "MODERATE",
      description: "May reduce effectiveness of Metformin.",
      recommendation: "Consult your doctor before using.",
    },
  ],
  overallRisk: "MODERATE",
  disclaimer:
    "This is not medical advice. Always consult your doctor or pharmacist.",
}

const homeResponse: CareCompanionHomeResponse = {
  refillSchedule: {
    schedules: [refillItem],
    hasMore: false,
  },
  costSummary,
  educationFeed: educationContentCard,
  emergencyCard: {
    conditionType: "HYPERTENSION",
    title: "Hypertension Emergency Guide",
    cardId: "erc-hyp-en",
  },
}

// ---------------------------------------------------------------------------
// Tests — backward-compatible types
// ---------------------------------------------------------------------------

describe("care-companion types", () => {
  describe("Medication", () => {
    it("has the expected fields with correct runtime values", () => {
      expect(medication.id).toBe("med-001")
      expect(medication.genericName).toBe("Metformin")
      expect(medication.brandNames).toEqual(["Glucophage", "Glycomet"])
      expect(medication.strengths).toEqual(["500mg", "850mg", "1000mg"])
      expect(medication.category).toBe("MEDICATION")
      expect(medication.conditionTags).toEqual(["DIABETES"])
    })

    it("accepts all valid category values", () => {
      const categories: Medication["category"][] = [
        "MEDICATION",
        "LAB_TEST",
        "CONSULTATION",
        "SUPPLY",
      ]
      expect(categories).toHaveLength(4)
    })

    it("accepts all valid conditionTags values", () => {
      const tags: Medication["conditionTags"] = [
        "HYPERTENSION",
        "DIABETES",
        "GENERAL",
      ]
      expect(tags).toHaveLength(3)
    })
  })

  describe("PatientMedication", () => {
    it("contains a nested Medication object", () => {
      expect(patientMedication.medication).toBeDefined()
      expect(patientMedication.medication.genericName).toBe("Metformin")
    })

    it("supports null for averageRefillIntervalDays", () => {
      const noRefillData: PatientMedication = {
        ...patientMedication,
        averageRefillIntervalDays: null,
      }
      expect(noRefillData.averageRefillIntervalDays).toBeNull()
    })

    it("stores dates as ISO 8601 strings", () => {
      expect(patientMedication.firstPurchaseDate).toMatch(
        /^\d{4}-\d{2}-\d{2}T/,
      )
      expect(patientMedication.lastPurchaseDate).toMatch(
        /^\d{4}-\d{2}-\d{2}T/,
      )
    })
  })

  describe("TimelineEntry", () => {
    it("has the expected fields", () => {
      expect(timelineEntry.date).toBeDefined()
      expect(timelineEntry.medicationName).toBe("Metformin 500mg")
      expect(timelineEntry.lineTotal).toBe("450.00")
      expect(typeof timelineEntry.lineTotal).toBe("string")
    })

    it("supports null for optional fields", () => {
      const minimal: TimelineEntry = {
        ...timelineEntry,
        dosage: null,
        quantity: null,
        gapDaysFromPrevious: null,
      }
      expect(minimal.dosage).toBeNull()
      expect(minimal.quantity).toBeNull()
      expect(minimal.gapDaysFromPrevious).toBeNull()
    })

    it("represents monetary values as strings", () => {
      expect(typeof timelineEntry.lineTotal).toBe("string")
    })
  })

  describe("CostSummary", () => {
    it("has all monetary fields as strings", () => {
      const moneyFields: (keyof CostSummary)[] = [
        "ytdSpend",
        "monthlyAverage",
        "cashbackEarned",
        "netSpend",
        "annualProjection",
      ]
      for (const field of moneyFields) {
        expect(typeof costSummary[field]).toBe("string")
      }
    })

    it("only accepts KES as currency", () => {
      const currency: CostSummary["currency"] = "KES"
      expect(currency).toBe("KES")
    })

    it("stores year as a number", () => {
      expect(typeof costSummary.year).toBe("number")
      expect(costSummary.year).toBe(2026)
    })
  })

  describe("CostCategoryBreakdown", () => {
    it("accepts all valid category values", () => {
      const categories: CostCategoryBreakdown["category"][] = [
        "MEDICATION",
        "LAB_TEST",
        "CONSULTATION",
        "SUPPLY",
      ]
      expect(categories).toHaveLength(4)
    })

    it("stores percentage as a number", () => {
      expect(typeof costCategoryBreakdown.percentage).toBe("number")
    })
  })

  describe("EmergencyCard", () => {
    it("has structured warning symptoms with severity levels", () => {
      expect(emergencyCard.warningSymptoms).toHaveLength(2)
      expect(emergencyCard.warningSymptoms[0].severity).toBe("warning")
      expect(emergencyCard.warningSymptoms[1].severity).toBe("critical")
    })

    it("has ordered immediate actions", () => {
      expect(emergencyCard.immediateActions[0].step).toBe(1)
      expect(emergencyCard.immediateActions[1].step).toBe(2)
    })

    it("supports the emergency transport credit CHP addition", () => {
      expect(emergencyCard.emergencyTransportCreditAvailable).toBe(true)
      expect(typeof emergencyCard.emergencyTransportCreditAmount).toBe("string")
    })

    it("supports null for emergencyTransportCreditAmount", () => {
      const noCredit: EmergencyCard = {
        ...emergencyCard,
        emergencyTransportCreditAvailable: false,
        emergencyTransportCreditAmount: null,
      }
      expect(noCredit.emergencyTransportCreditAmount).toBeNull()
    })

    it("accepts all valid conditionType values", () => {
      const types: EmergencyCard["conditionType"][] = [
        "HYPERTENSION",
        "DIABETES",
        "GENERAL",
      ]
      expect(types).toHaveLength(3)
    })

    it("accepts all valid locale values", () => {
      const locales: EmergencyCard["locale"][] = ["EN", "SW"]
      expect(locales).toHaveLength(2)
    })
  })

  describe("MedicationCard", () => {
    it("references medication by ID", () => {
      expect(medicationCard.medicationId).toBe("med-001")
    })

    it("has structured side effects", () => {
      expect(medicationCard.commonSideEffects).toHaveLength(1)
      expect(medicationCard.commonSideEffects[0]).toHaveProperty("effect")
      expect(medicationCard.commonSideEffects[0]).toHaveProperty("frequency")
      expect(medicationCard.commonSideEffects[0]).toHaveProperty("advice")
    })

    it("has structured serious side effects", () => {
      expect(medicationCard.seriousSideEffects[0]).toHaveProperty("effect")
      expect(medicationCard.seriousSideEffects[0]).toHaveProperty("action")
    })

    it("has structured avoidance warnings", () => {
      expect(medicationCard.avoidanceWarnings[0]).toHaveProperty("substance")
      expect(medicationCard.avoidanceWarnings[0]).toHaveProperty("reason")
    })

    it("supports null for howItWorks", () => {
      const noMechanism: MedicationCard = {
        ...medicationCard,
        howItWorks: null,
      }
      expect(noMechanism.howItWorks).toBeNull()
    })

    it("supports null for storageInstructions", () => {
      const noStorage: MedicationCard = {
        ...medicationCard,
        storageInstructions: null,
      }
      expect(noStorage.storageInstructions).toBeNull()
    })
  })

  describe("MedicationInteraction", () => {
    it("accepts all valid severity levels", () => {
      const severities: MedicationInteraction["severity"][] = [
        "MILD",
        "MODERATE",
        "SEVERE",
        "CONTRAINDICATED",
      ]
      expect(severities).toHaveLength(4)
    })

    it("supports herb-medication interactions (medicationBId null, herbName set)", () => {
      const herbInteraction: MedicationInteraction = {
        ...medicationInteraction,
        medicationBId: null,
        herbName: "St. John's Wort",
      }
      expect(herbInteraction.medicationBId).toBeNull()
      expect(herbInteraction.herbName).toBe("St. John's Wort")
    })

    it("supports drug-drug interactions (herbName null, medicationBId set)", () => {
      expect(medicationInteraction.medicationBId).toBe("med-002")
      expect(medicationInteraction.herbName).toBeNull()
    })

    it("has bilingual descriptions", () => {
      expect(medicationInteraction.descriptionEn).toBeDefined()
      expect(medicationInteraction.descriptionSw).toBeNull()
    })

    it("supports nullable source reference", () => {
      expect(medicationInteraction.source).toBe("BNF Kenya 2025")
      const noSource: MedicationInteraction = {
        ...medicationInteraction,
        source: null,
      }
      expect(noSource.source).toBeNull()
    })
  })

  describe("RefillSchedule", () => {
    it("accepts all valid status values", () => {
      const statuses: RefillSchedule["status"][] = [
        "UPCOMING",
        "DUE",
        "OVERDUE",
        "REFILLED",
        "CANCELLED",
      ]
      expect(statuses).toHaveLength(5)
    })

    it("supports null for estimatedDaysSupply", () => {
      const noEstimate: RefillSchedule = {
        ...refillSchedule,
        estimatedDaysSupply: null,
      }
      expect(noEstimate.estimatedDaysSupply).toBeNull()
    })

    it("tracks loan escalation state", () => {
      expect(typeof refillSchedule.escalatedToLoanOffer).toBe("boolean")
    })
  })

  describe("EducationContentType", () => {
    it("accepts all valid content types", () => {
      const types: EducationContentType[] = [
        "DIETARY",
        "EXERCISE",
        "MYTH_BUSTING",
        "EMOTIONAL",
        "SELF_MONITORING",
        "MILESTONE",
        "ACCEPTANCE",
      ]
      expect(types).toHaveLength(7)
    })
  })

  describe("EducationContentCard", () => {
    it("has the expected fields", () => {
      expect(educationContentCard.weekNumber).toBe(3)
      expect(educationContentCard.contentType).toBe("DIETARY")
      expect(educationContentCard.conditionType).toBe("DIABETES")
    })

    it("has imageUrl and isPublished from the spec", () => {
      expect(educationContentCard.imageUrl).toBeNull()
      expect(educationContentCard.isPublished).toBe(true)
    })

    it("supports CHP household compatibility metadata as nullable", () => {
      expect(educationContentCard.householdCompatible).toBe(true)
      expect(educationContentCard.costNeutral).toBeNull()

      const noMetadata: EducationContentCard = {
        ...educationContentCard,
        householdCompatible: null,
        costNeutral: null,
      }
      expect(noMetadata.householdCompatible).toBeNull()
      expect(noMetadata.costNeutral).toBeNull()
    })
  })

  describe("PharmacyStock", () => {
    it("accepts all valid stock status values", () => {
      const statuses: PharmacyStock["status"][] = [
        "IN_STOCK",
        "LOW_STOCK",
        "OUT_OF_STOCK",
      ]
      expect(statuses).toHaveLength(3)
    })

    it("supports null distance for unknown location", () => {
      const noDistance: PharmacyStock = {
        ...pharmacyStock,
        distance: null,
      }
      expect(noDistance.distance).toBeNull()
    })

    it("stores coordinates as numbers", () => {
      expect(typeof pharmacyStock.lat).toBe("number")
      expect(typeof pharmacyStock.lng).toBe("number")
    })

    it("uses a numeric facilityId", () => {
      expect(typeof pharmacyStock.facilityId).toBe("number")
    })
  })

  describe("MedicationLoanPreApproval", () => {
    it("stores monetary values as strings inside preApprovalDetails", () => {
      expect(typeof medicationLoanPreApproval.preApprovalDetails?.maxAmount).toBe(
        "string",
      )
      expect(
        typeof medicationLoanPreApproval.preApprovalDetails?.medications[0]
          .estimatedCost,
      ).toBe("string")
    })

    it("has a target pharmacy with numeric id", () => {
      expect(
        typeof medicationLoanPreApproval.preApprovalDetails?.targetPharmacy.id,
      ).toBe("number")
      expect(
        typeof medicationLoanPreApproval.preApprovalDetails?.targetPharmacy.name,
      ).toBe("string")
    })

    it("has a boolean pre-approval flag", () => {
      expect(typeof medicationLoanPreApproval.isPreApproved).toBe("boolean")
    })

    it("represents a declined pre-approval with null details", () => {
      const declined: MedicationLoanPreApproval = {
        isPreApproved: false,
        preApprovalDetails: null,
      }
      expect(declined.isPreApproved).toBe(false)
      expect(declined.preApprovalDetails).toBeNull()
    })
  })

  describe("EmergencyTransportCredit", () => {
    it("stores preApprovedAmount as a string", () => {
      expect(typeof emergencyTransportCredit.preApprovedAmount).toBe("string")
    })

    it("stores expiresAt as an ISO 8601 date string", () => {
      expect(emergencyTransportCredit.expiresAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T/,
      )
    })
  })

  describe("AssistantMessage", () => {
    it("accepts all valid role values", () => {
      const roles: AssistantMessage["role"][] = [
        "USER",
        "ASSISTANT",
        "SYSTEM",
      ]
      expect(roles).toHaveLength(3)
    })

    it("accepts all valid suggested action types", () => {
      const actionTypes: AssistantMessage["suggestedActions"][number]["type"][] =
        ["PAY", "CHECK_STOCK", "APPLY_LOAN", "VIEW_CARD"]
      expect(actionTypes).toHaveLength(4)
    })

    it("supports empty guardrailFlags and suggestedActions", () => {
      const minimal: AssistantMessage = {
        ...assistantMessage,
        guardrailFlags: [],
        suggestedActions: [],
      }
      expect(minimal.guardrailFlags).toHaveLength(0)
      expect(minimal.suggestedActions).toHaveLength(0)
    })

    it("stores timestamp as an ISO 8601 string", () => {
      expect(assistantMessage.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  describe("CareCompanionHome", () => {
    it("has a refillSchedule with schedules array and hasMore flag", () => {
      expect(careCompanionHome.refillSchedule.schedules).toHaveLength(1)
      expect(typeof careCompanionHome.refillSchedule.hasMore).toBe("boolean")
    })

    it("contains a costSummary", () => {
      expect(careCompanionHome.costSummary).toBeDefined()
      expect(careCompanionHome.costSummary.currency).toBe("KES")
    })

    it("supports null educationFeed", () => {
      const noFeed: CareCompanionHome = {
        ...careCompanionHome,
        educationFeed: null,
      }
      expect(noFeed.educationFeed).toBeNull()
    })

    it("supports null emergencyCard", () => {
      const noCard: CareCompanionHome = {
        ...careCompanionHome,
        emergencyCard: null,
      }
      expect(noCard.emergencyCard).toBeNull()
    })

    it("supports null emergencyTransportCredit", () => {
      const noCredit: CareCompanionHome = {
        ...careCompanionHome,
        emergencyTransportCredit: null,
      }
      expect(noCredit.emergencyTransportCredit).toBeNull()
    })
  })

  describe("CareCompanionProfile", () => {
    it("has all six nested sub-objects", () => {
      expect(careCompanionProfile.conditions).toBeDefined()
      expect(careCompanionProfile.treatment).toBeDefined()
      expect(careCompanionProfile.challenges).toBeDefined()
      expect(careCompanionProfile.coping).toBeDefined()
      expect(careCompanionProfile.goals).toBeDefined()
      expect(careCompanionProfile.userRole).toBeDefined()
    })

    it("supports skipped profile (completedAt null, skippedAt set)", () => {
      const skipped: CareCompanionProfile = {
        ...careCompanionProfile,
        completedAt: null,
        skippedAt: "2026-08-20T14:00:00Z",
      }
      expect(skipped.completedAt).toBeNull()
      expect(skipped.skippedAt).toBeDefined()
    })

    describe("conditions sub-object", () => {
      it("accepts all valid condition types", () => {
        const allTypes: CareCompanionProfile["conditions"]["type"] = [
          "DIABETES",
          "HYPERTENSION",
          "ASTHMA",
          "CANCER",
          "KIDNEY_DISEASE",
          "HEART_DISEASE",
          "SICKLE_CELL",
          "OTHER",
        ]
        expect(allTypes).toHaveLength(8)
      })

      it("accepts all valid diagnosisRecency values including null", () => {
        const recencies: CareCompanionProfile["conditions"]["diagnosisRecency"][] =
          [
            "LESS_THAN_6_MONTHS",
            "6_MONTHS_TO_2_YEARS",
            "MORE_THAN_2_YEARS",
            null,
          ]
        expect(recencies).toHaveLength(4)
      })

      it("supports OTHER with description", () => {
        const withOther: CareCompanionProfile["conditions"] = {
          type: ["OTHER"],
          otherDescription: "Lupus",
          diagnosisRecency: "LESS_THAN_6_MONTHS",
        }
        expect(withOther.otherDescription).toBe("Lupus")
      })
    })

    describe("treatment sub-object", () => {
      it("accepts all valid takingMedicationRegularly values including null", () => {
        const values: CareCompanionProfile["treatment"]["takingMedicationRegularly"][] =
          ["ALWAYS", "MOSTLY", "SOMETIMES", "RARELY", null]
        expect(values).toHaveLength(5)
      })

      it("accepts all valid reasonsForMissing values", () => {
        const reasons: CareCompanionProfile["treatment"]["reasonsForMissing"] =
          ["COST", "FORGOT", "SIDE_EFFECTS", "FEEL_FINE", "STOCK_OUT", "OTHER"]
        expect(reasons).toHaveLength(6)
      })

      it("supports herbal alternatives with details", () => {
        const herbal: CareCompanionProfile["treatment"] = {
          ...careCompanionProfile.treatment,
          usingHerbalAlternatives: true,
          herbalDetails: "Uses aloe vera for blood sugar control",
        }
        expect(herbal.usingHerbalAlternatives).toBe(true)
        expect(herbal.herbalDetails).toBeDefined()
      })

      it("supports null herbalDetails when not using alternatives", () => {
        expect(careCompanionProfile.treatment.herbalDetails).toBeNull()
      })
    })

    describe("challenges sub-object", () => {
      it("accepts all valid challenge types", () => {
        const allChallenges: CareCompanionProfile["challenges"]["selected"] = [
          "COST",
          "UNDERSTANDING_MEDICATION",
          "DIET",
          "EXERCISE",
          "SIDE_EFFECTS",
          "FINDING_PHARMACY",
          "EMOTIONAL",
          "FAMILY_SUPPORT",
          "EMERGENCY_PREPAREDNESS",
          "NAVIGATING_SYSTEM",
          "STIGMA",
        ]
        expect(allChallenges).toHaveLength(11)
      })

      it("supports null topChallenge", () => {
        const noTop: CareCompanionProfile["challenges"] = {
          selected: [],
          topChallenge: null,
        }
        expect(noTop.topChallenge).toBeNull()
      })
    })

    describe("coping sub-object", () => {
      it("accepts all valid costCoping values including null for the whole array", () => {
        const allCoping: NonNullable<
          CareCompanionProfile["coping"]["costCoping"]
        > = [
          "BORROW_FAMILY",
          "SKIP_DOSES",
          "CHEAPER_ALTERNATIVES",
          "SELL_ASSETS",
          "FUNDRAISE",
          "NOTHING",
          "OTHER",
        ]
        expect(allCoping).toHaveLength(7)

        const noCostCoping: CareCompanionProfile["coping"] = {
          ...careCompanionProfile.coping,
          costCoping: null,
        }
        expect(noCostCoping.costCoping).toBeNull()
      })

      it("accepts all valid informationSources values", () => {
        const allSources: CareCompanionProfile["coping"]["informationSources"] =
          [
            "DOCTOR",
            "PHARMACIST",
            "WHATSAPP",
            "INTERNET",
            "FAMILY",
            "CHP",
            "TRADITIONAL_HEALER",
            "NONE",
          ]
        expect(allSources).toHaveLength(8)
      })

      it("accepts all valid exerciseFrequency values including null", () => {
        const freqs: CareCompanionProfile["coping"]["exerciseFrequency"][] = [
          "DAILY",
          "FEW_TIMES_WEEK",
          "RARELY",
          "NEVER",
          null,
        ]
        expect(freqs).toHaveLength(5)
      })

      it("supports null hasEmergencyPlan", () => {
        const unknown: CareCompanionProfile["coping"] = {
          ...careCompanionProfile.coping,
          hasEmergencyPlan: null,
        }
        expect(unknown.hasEmergencyPlan).toBeNull()
      })
    })

    describe("goals sub-object", () => {
      it("accepts all valid goal types", () => {
        const allGoals: CareCompanionProfile["goals"]["selected"] = [
          "TRACK_COSTS",
          "MEDICATION_REMINDERS",
          "UNDERSTAND_MEDICATION",
          "FIND_AFFORDABLE_PHARMACY",
          "EMERGENCY_HELP",
          "DIET_TIPS",
          "EXERCISE_GUIDANCE",
          "EMOTIONAL_SUPPORT",
          "CREDIT_FOR_MEDICATION",
          "SHARE_WITH_FAMILY",
        ]
        expect(allGoals).toHaveLength(10)
      })
    })

    describe("userRole sub-object", () => {
      it("accepts all valid role values", () => {
        const roles: CareCompanionProfile["userRole"]["role"][] = [
          "SELF",
          "CAREGIVER",
          "BOTH",
        ]
        expect(roles).toHaveLength(3)
      })

      it("accepts all valid patientRelationship values including null", () => {
        const relationships: CareCompanionProfile["userRole"]["patientRelationship"][] =
          ["SPOUSE", "PARENT", "CHILD", "SIBLING", "OTHER", null]
        expect(relationships).toHaveLength(6)
      })

      it("supports SELF role with null relationship", () => {
        const selfRole: CareCompanionProfile["userRole"] = {
          role: "SELF",
          patientRelationship: null,
        }
        expect(selfRole.patientRelationship).toBeNull()
      })
    })
  })
})

// ---------------------------------------------------------------------------
// Tests — new spec-aligned entity interfaces
// ---------------------------------------------------------------------------

describe("care-companion spec-aligned entity interfaces", () => {
  describe("MedicationTaxonomyEntry", () => {
    it("has all spec-defined fields", () => {
      expect(taxonomyEntry.id).toBe("mte-001")
      expect(taxonomyEntry.genericName).toBe("Metformin")
      expect(taxonomyEntry.atcCode).toBe("A10BA02")
      expect(taxonomyEntry.isActive).toBe(true)
    })

    it("supports nullable array fields", () => {
      const minimal: MedicationTaxonomyEntry = {
        ...taxonomyEntry,
        brandNames: null,
        dosageForms: null,
        strengths: null,
        synonyms: null,
        conditionTags: null,
        atcCode: null,
      }
      expect(minimal.brandNames).toBeNull()
      expect(minimal.dosageForms).toBeNull()
    })
  })

  describe("ParsedInvoiceLineItem", () => {
    it("has monetary fields typed as strings", () => {
      expect(typeof parsedLineItem.lineTotal).toBe("string")
      expect(typeof parsedLineItem.unitPrice).toBe("string")
    })

    it("supports SUBMITTED_INVOICE source with null medicalInvoiceItemId", () => {
      expect(parsedLineItem.sourceType).toBe("SUBMITTED_INVOICE")
      expect(parsedLineItem.submittedInvoiceId).toBe("inv-001")
      expect(parsedLineItem.medicalInvoiceItemId).toBeNull()
    })

    it("supports MEDICAL_INVOICE_ITEM source", () => {
      const mii: ParsedInvoiceLineItem = {
        ...parsedLineItem,
        sourceType: "MEDICAL_INVOICE_ITEM",
        submittedInvoiceId: null,
        medicalInvoiceItemId: 42,
      }
      expect(mii.submittedInvoiceId).toBeNull()
      expect(mii.medicalInvoiceItemId).toBe(42)
    })

    it("supports nullable optional fields", () => {
      const unresolved: ParsedInvoiceLineItem = {
        ...parsedLineItem,
        medicationId: null,
        parsedDosage: null,
        parsedQuantity: null,
        unitPrice: null,
        reviewedByUserId: null,
      }
      expect(unresolved.medicationId).toBeNull()
    })
  })

  describe("PatientMedicationRecord", () => {
    it("has a denormalized medication sub-object", () => {
      expect(patientMedicationRecord.medication.genericName).toBe("Metformin")
      expect(patientMedicationRecord.medication.brandNames).toEqual([
        "Glucophage",
        "Glycomet",
      ])
      expect(patientMedicationRecord.medication.category).toBe("MEDICATION")
    })

    it("supports null for averageRefillIntervalDays", () => {
      const fresh: PatientMedicationRecord = {
        ...patientMedicationRecord,
        averageRefillIntervalDays: null,
      }
      expect(fresh.averageRefillIntervalDays).toBeNull()
    })
  })

  describe("CostBreakdownResponse", () => {
    it("has categories, monthlyTrend, and pagination", () => {
      expect(costBreakdown.categories).toHaveLength(1)
      expect(costBreakdown.monthlyTrend).toHaveLength(2)
      expect(costBreakdown.pagination.total).toBe(8)
    })

    it("stores spend in monthlyTrend as string", () => {
      expect(typeof costBreakdown.monthlyTrend[0].spend).toBe("string")
    })
  })

  describe("EmergencyReferenceCard", () => {
    it("has version and isPublished metadata", () => {
      expect(emergencyRefCard.version).toBe(2)
      expect(emergencyRefCard.isPublished).toBe(true)
    })

    it("uses named sub-types for JSONB fields", () => {
      const ws: WarningSymptom = emergencyRefCard.warningSymptoms[0]
      expect(ws.symptom).toBe("Severe headache")

      const ia: ImmediateAction = emergencyRefCard.immediateActions[0]
      expect(ia.step).toBe(1)
    })

    it("supports null for doNotDo", () => {
      const noDoNotDo: EmergencyReferenceCard = {
        ...emergencyRefCard,
        doNotDo: null,
      }
      expect(noDoNotDo.doNotDo).toBeNull()
    })
  })

  describe("RefillScheduleItem", () => {
    it("matches the RefillSchedule alias shape", () => {
      const item: RefillScheduleItem = refillItem
      const schedule: RefillSchedule = item
      expect(schedule.id).toBe(item.id)
    })
  })

  describe("PharmacyStockItem", () => {
    it("has a nested facility object", () => {
      expect(stockItem.facility.id).toBe(42)
      expect(stockItem.facility.name).toBe("MedPlus Pharmacy Westlands")
    })

    it("supports null distance when geolocation unavailable", () => {
      const noGeo: PharmacyStockItem = {
        ...stockItem,
        distance: null,
      }
      expect(noGeo.distance).toBeNull()
    })
  })

  describe("AiAssistantMessage", () => {
    it("has sessionId and nested message with guardrailFlags", () => {
      expect(aiMessage.sessionId).toBe("session-001")
      expect(aiMessage.message.guardrailFlags).toContain("disclaimer_shown")
    })

    it("has suggestedActions with typed actions", () => {
      expect(aiMessage.suggestedActions).toHaveLength(1)
      expect(aiMessage.suggestedActions[0].type).toBe("CHECK_STOCK")
    })
  })

  describe("InteractionCheckResult", () => {
    it("has productName, interactions, overallRisk, and disclaimer", () => {
      expect(interactionCheck.productName).toBe("St. John's Wort")
      expect(interactionCheck.interactions).toHaveLength(1)
      expect(interactionCheck.overallRisk).toBe("MODERATE")
      expect(interactionCheck.disclaimer).toBeDefined()
    })

    it("accepts all valid overallRisk values", () => {
      const risks: InteractionCheckResult["overallRisk"][] = [
        "NONE",
        "LOW",
        "MODERATE",
        "HIGH",
      ]
      expect(risks).toHaveLength(4)
    })
  })

  describe("CareCompanionHomeResponse", () => {
    it("matches the BFF endpoint shape from API-021", () => {
      expect(homeResponse.refillSchedule.schedules).toHaveLength(1)
      expect(homeResponse.costSummary.currency).toBe("KES")
      expect(homeResponse.educationFeed).toBeDefined()
      expect(homeResponse.emergencyCard?.cardId).toBe("erc-hyp-en")
    })

    it("supports null educationFeed and emergencyCard", () => {
      const empty: CareCompanionHomeResponse = {
        ...homeResponse,
        educationFeed: null,
        emergencyCard: null,
      }
      expect(empty.educationFeed).toBeNull()
      expect(empty.emergencyCard).toBeNull()
    })
  })

  describe("PaginatedResponse", () => {
    it("wraps any type with pagination metadata", () => {
      const page: PaginatedResponse<TimelineEntry> = {
        data: [timelineEntry],
        pagination: { total: 1, limit: 20, offset: 0 },
      }
      expect(page.data).toHaveLength(1)
      expect(page.pagination.total).toBe(1)
    })

    it("works with empty data arrays", () => {
      const empty: PaginatedResponse<MedicationCard> = {
        data: [],
        pagination: { total: 0, limit: 20, offset: 0 },
      }
      expect(empty.data).toHaveLength(0)
    })
  })

  describe("MonthlySpend", () => {
    it("stores month as a number and spend as a string", () => {
      const ms: MonthlySpend = { month: 6, spend: "4200.00" }
      expect(typeof ms.month).toBe("number")
      expect(typeof ms.spend).toBe("string")
    })

    it("represents months as 1-indexed integers", () => {
      const jan: MonthlySpend = { month: 1, spend: "0.00" }
      const dec: MonthlySpend = { month: 12, spend: "9999.99" }
      expect(jan.month).toBe(1)
      expect(dec.month).toBe(12)
    })
  })

  describe("all 16 spec entity interfaces are importable", () => {
    it("can reference every spec-aligned interface", () => {
      const entities: Record<string, unknown> = {
        MedicationTaxonomyEntry: taxonomyEntry,
        ParsedInvoiceLineItem: parsedLineItem,
        PatientMedicationRecord: patientMedicationRecord,
        CostSummary: costSummary,
        CostBreakdownResponse: costBreakdown,
        EmergencyReferenceCard: emergencyRefCard,
        MedicationCard: medicationCard,
        MedicationInteraction: medicationInteraction,
        RefillScheduleItem: refillItem,
        EducationContentCard: educationContentCard,
        PharmacyStockItem: stockItem,
        MedicationLoanPreApproval: medicationLoanPreApproval,
        AiAssistantMessage: aiMessage,
        InteractionCheckResult: interactionCheck,
        CareCompanionHomeResponse: homeResponse,
        TimelineEntry: timelineEntry,
      }
      expect(Object.keys(entities)).toHaveLength(16)
    })
  })
})

// ---------------------------------------------------------------------------
// Edge case tests — boundary values, empty states, healthcare-specific
// scenarios that could cause real bugs if the type contract drifts
// ---------------------------------------------------------------------------

describe("care-companion edge cases", () => {
  describe("RefillScheduleItem overdue scenario", () => {
    it("represents overdue refills with negative daysUntilRefill", () => {
      const overdue: RefillScheduleItem = {
        id: "rsi-overdue",
        medicationName: "Lisinopril 10mg",
        expectedRefillDate: "2026-08-10",
        status: "OVERDUE",
        daysUntilRefill: -15,
        estimatedDaysSupply: 30,
        escalatedToLoanOffer: true,
      }
      expect(overdue.daysUntilRefill).toBeLessThan(0)
      expect(overdue.status).toBe("OVERDUE")
      expect(overdue.escalatedToLoanOffer).toBe(true)
    })

    it("represents a refill that is due today with zero daysUntilRefill", () => {
      const dueToday: RefillScheduleItem = {
        id: "rsi-today",
        medicationName: "Metformin 500mg",
        expectedRefillDate: "2026-08-25",
        status: "DUE",
        daysUntilRefill: 0,
        estimatedDaysSupply: 30,
        escalatedToLoanOffer: false,
      }
      expect(dueToday.daysUntilRefill).toBe(0)
      expect(dueToday.status).toBe("DUE")
    })
  })

  describe("AiAssistantMessage empty states", () => {
    it("supports empty guardrailFlags and suggestedActions", () => {
      const clean: AiAssistantMessage = {
        sessionId: "session-empty",
        message: {
          content: "Everything looks good with your medications.",
          guardrailFlags: [],
        },
        suggestedActions: [],
      }
      expect(clean.message.guardrailFlags).toHaveLength(0)
      expect(clean.suggestedActions).toHaveLength(0)
    })

    it("supports multiple guardrail flags for sensitive content", () => {
      const flagged: AiAssistantMessage = {
        sessionId: "session-flagged",
        message: {
          content: "I cannot provide dosage recommendations.",
          guardrailFlags: [
            "medical_advice_boundary",
            "disclaimer_shown",
            "escalate_to_doctor",
          ],
        },
        suggestedActions: [],
      }
      expect(flagged.message.guardrailFlags).toHaveLength(3)
    })
  })

  describe("InteractionCheckResult clean product", () => {
    it("represents a product with no known interactions", () => {
      const clean: InteractionCheckResult = {
        productName: "Vitamin D3",
        interactions: [],
        overallRisk: "NONE",
        disclaimer:
          "This is not medical advice. Always consult your doctor or pharmacist.",
      }
      expect(clean.interactions).toHaveLength(0)
      expect(clean.overallRisk).toBe("NONE")
    })

    it("represents a product with multiple interactions at different severities", () => {
      const multi: InteractionCheckResult = {
        productName: "Grapefruit",
        interactions: [
          {
            withMedication: "Amlodipine",
            severity: "MODERATE",
            description: "Increases blood levels of Amlodipine.",
            recommendation: "Avoid grapefruit or consult doctor.",
          },
          {
            withMedication: "Simvastatin",
            severity: "SEVERE",
            description: "Significantly increases risk of muscle damage.",
            recommendation: "Do not consume grapefruit with this medication.",
          },
        ],
        overallRisk: "HIGH",
        disclaimer:
          "This is not medical advice. Always consult your doctor or pharmacist.",
      }
      expect(multi.interactions).toHaveLength(2)
      expect(multi.overallRisk).toBe("HIGH")
      // The highest severity interaction should be identifiable
      const severe = multi.interactions.find((i) => i.severity === "SEVERE")
      expect(severe?.withMedication).toBe("Simvastatin")
    })
  })

  describe("MedicationCard empty arrays", () => {
    it("supports medications with no known side effects or warnings", () => {
      const minimal: MedicationCard = {
        id: "mc-minimal",
        medicationId: "med-safe",
        locale: "EN",
        description: "A well-tolerated medication.",
        howItWorks: null,
        commonSideEffects: [],
        seriousSideEffects: [],
        avoidanceWarnings: [],
        whenToSeekHelp: "If you experience any unusual symptoms",
        storageInstructions: null,
      }
      expect(minimal.commonSideEffects).toHaveLength(0)
      expect(minimal.seriousSideEffects).toHaveLength(0)
      expect(minimal.avoidanceWarnings).toHaveLength(0)
    })
  })

  describe("CostBreakdownResponse empty states", () => {
    it("represents a new patient with no spending data", () => {
      const empty: CostBreakdownResponse = {
        year: 2026,
        categories: [],
        monthlyTrend: [],
        pagination: { total: 0, limit: 12, offset: 0 },
      }
      expect(empty.categories).toHaveLength(0)
      expect(empty.monthlyTrend).toHaveLength(0)
      expect(empty.pagination.total).toBe(0)
    })
  })

  describe("ParsedInvoiceLineItem confidence boundaries", () => {
    it("accepts confidence at lower bound (0.0 — no match confidence)", () => {
      const lowConf: ParsedInvoiceLineItem = {
        ...parsedLineItem,
        confidence: 0.0,
        reviewStatus: "PENDING_REVIEW",
      }
      expect(lowConf.confidence).toBe(0.0)
    })

    it("accepts confidence at upper bound (1.0 — perfect match)", () => {
      const perfect: ParsedInvoiceLineItem = {
        ...parsedLineItem,
        confidence: 1.0,
        reviewStatus: "AUTO_ACCEPTED",
      }
      expect(perfect.confidence).toBe(1.0)
    })
  })

  describe("PatientMedicationRecord empty collections", () => {
    it("supports medications with no brand names", () => {
      const generic: PatientMedicationRecord = {
        ...patientMedicationRecord,
        medication: {
          genericName: "Hydrochlorothiazide",
          brandNames: [],
          category: "MEDICATION",
        },
      }
      expect(generic.medication.brandNames).toHaveLength(0)
    })

    it("supports patients with no inferred conditions", () => {
      const noConditions: PatientMedicationRecord = {
        ...patientMedicationRecord,
        inferredConditions: [],
      }
      expect(noConditions.inferredConditions).toHaveLength(0)
    })

    it("represents a first-time purchase with count of 1", () => {
      const firstTime: PatientMedicationRecord = {
        ...patientMedicationRecord,
        totalPurchaseCount: 1,
        averageRefillIntervalDays: null,
        firstPurchaseDate: "2026-08-25",
        lastPurchaseDate: "2026-08-25",
      }
      expect(firstTime.totalPurchaseCount).toBe(1)
      expect(firstTime.averageRefillIntervalDays).toBeNull()
      expect(firstTime.firstPurchaseDate).toBe(firstTime.lastPurchaseDate)
    })
  })

  describe("PaginatedResponse pagination scenarios", () => {
    it("represents a second page with offset > 0", () => {
      const page2: PaginatedResponse<TimelineEntry> = {
        data: [timelineEntry],
        pagination: { total: 45, limit: 20, offset: 20 },
      }
      expect(page2.pagination.offset).toBe(20)
      expect(page2.pagination.total).toBeGreaterThan(
        page2.pagination.offset + page2.data.length,
      )
    })

    it("represents the last page where offset + data.length equals total", () => {
      const lastPage: PaginatedResponse<TimelineEntry> = {
        data: [timelineEntry],
        pagination: { total: 21, limit: 20, offset: 20 },
      }
      expect(lastPage.pagination.offset + lastPage.data.length).toBe(
        lastPage.pagination.total,
      )
    })
  })

  describe("CareCompanionHomeResponse truncated refill list", () => {
    it("signals more refills available with hasMore=true", () => {
      const truncated: CareCompanionHomeResponse = {
        ...homeResponse,
        refillSchedule: {
          schedules: [
            refillItem,
            { ...refillItem, id: "rsi-002", medicationName: "Lisinopril 10mg" },
            {
              ...refillItem,
              id: "rsi-003",
              medicationName: "Amlodipine 5mg",
            },
          ],
          hasMore: true,
        },
      }
      expect(truncated.refillSchedule.schedules).toHaveLength(3)
      expect(truncated.refillSchedule.hasMore).toBe(true)
    })

    it("represents a patient with no refills, no education, no emergency card", () => {
      const empty: CareCompanionHomeResponse = {
        refillSchedule: {
          schedules: [],
          hasMore: false,
        },
        costSummary,
        educationFeed: null,
        emergencyCard: null,
      }
      expect(empty.refillSchedule.schedules).toHaveLength(0)
      expect(empty.educationFeed).toBeNull()
      expect(empty.emergencyCard).toBeNull()
    })
  })

  describe("MedicationTaxonomyEntry inactive medication", () => {
    it("represents a deactivated medication entry", () => {
      const inactive: MedicationTaxonomyEntry = {
        ...taxonomyEntry,
        isActive: false,
      }
      expect(inactive.isActive).toBe(false)
    })
  })

  describe("MedicationLoanPreApproval with multiple medications", () => {
    it("supports pre-approval covering multiple medications", () => {
      const multi: MedicationLoanPreApproval = {
        isPreApproved: true,
        preApprovalDetails: {
          maxAmount: "12000.00",
          medications: [
            { name: "Metformin 500mg", estimatedCost: "450.00" },
            { name: "Lisinopril 10mg", estimatedCost: "600.00" },
            { name: "Amlodipine 5mg", estimatedCost: "350.00" },
          ],
          targetPharmacy: { id: 42, name: "MedPlus Pharmacy Westlands" },
          reason: "Good repayment history.",
          expiresAt: "2026-09-25T00:00:00Z",
        },
      }
      expect(multi.preApprovalDetails?.medications).toHaveLength(3)
    })
  })

  describe("EmergencyReferenceCard Swahili locale", () => {
    it("supports SW locale for Kenyan patients", () => {
      const swCard: EmergencyReferenceCard = {
        ...emergencyRefCard,
        id: "erc-hyp-sw",
        locale: "SW",
        title: "Kadi ya Dharura ya Shinikizo la Damu",
      }
      expect(swCard.locale).toBe("SW")
    })
  })

  describe("TimelineEntry gap anomaly detection", () => {
    it("flags a purchase gap exceeding 1.5x the average refill interval", () => {
      const anomaly: TimelineEntry = {
        ...timelineEntry,
        gapDaysFromPrevious: 65,
        isGapAnomaly: true,
      }
      expect(anomaly.isGapAnomaly).toBe(true)
      expect(anomaly.gapDaysFromPrevious).toBeGreaterThan(30 * 1.5)
    })

    it("does not flag a gap within normal range", () => {
      expect(timelineEntry.isGapAnomaly).toBe(false)
      expect(timelineEntry.gapDaysFromPrevious).toBeLessThanOrEqual(30 * 1.5)
    })

    it("represents the first purchase in the timeline with null gap", () => {
      const first: TimelineEntry = {
        ...timelineEntry,
        gapDaysFromPrevious: null,
        isGapAnomaly: false,
      }
      expect(first.gapDaysFromPrevious).toBeNull()
      expect(first.isGapAnomaly).toBe(false)
    })
  })

  describe("MedicationInteraction Swahili description", () => {
    it("supports bilingual interaction descriptions", () => {
      const bilingual: MedicationInteraction = {
        ...medicationInteraction,
        descriptionEn: "May cause low blood sugar when taken together.",
        descriptionSw: "Inaweza kusababisha sukari ndogo ya damu ikichukuliwa pamoja.",
      }
      expect(bilingual.descriptionEn).toBeDefined()
      expect(bilingual.descriptionSw).toBeDefined()
      expect(bilingual.descriptionSw).not.toBeNull()
    })
  })
})

// ---------------------------------------------------------------------------
// Enum const object tests
// ---------------------------------------------------------------------------

describe("care-companion enum const objects", () => {
  function assertEnumShape(
    enumObj: Record<string, string>,
    expectedValues: string[],
  ) {
    const keys = Object.keys(enumObj)
    const values = Object.values(enumObj)

    expect(keys).toHaveLength(expectedValues.length)
    expect(values).toHaveLength(expectedValues.length)

    for (const val of expectedValues) {
      expect(enumObj).toHaveProperty(val, val)
    }

    for (const key of keys) {
      expect(expectedValues).toContain(key)
    }

    for (const key of keys) {
      expect(enumObj[key]).toBe(key)
    }
  }

  describe("MEDICATION_CATEGORY", () => {
    it("contains exactly the 4 spec-defined members", () => {
      assertEnumShape(MEDICATION_CATEGORY, [
        "MEDICATION",
        "LAB_TEST",
        "CONSULTATION",
        "SUPPLY",
      ])
    })

    it("values are usable as MedicationCategory type", () => {
      const val: MedicationCategory = MEDICATION_CATEGORY.MEDICATION
      expect(val).toBe("MEDICATION")
    })
  })

  describe("INVOICE_SOURCE_TYPE", () => {
    it("contains exactly the 2 spec-defined members", () => {
      assertEnumShape(INVOICE_SOURCE_TYPE, [
        "SUBMITTED_INVOICE",
        "MEDICAL_INVOICE_ITEM",
      ])
    })

    it("values are usable as InvoiceSourceType type", () => {
      const val: InvoiceSourceType = INVOICE_SOURCE_TYPE.SUBMITTED_INVOICE
      expect(val).toBe("SUBMITTED_INVOICE")
    })
  })

  describe("PARSE_METHOD", () => {
    it("contains exactly the 4 spec-defined members", () => {
      assertEnumShape(PARSE_METHOD, [
        "FUZZY_MATCH",
        "NLP",
        "STRUCTURED_INPUT",
        "MANUAL",
      ])
    })

    it("values are usable as ParseMethod type", () => {
      const val: ParseMethod = PARSE_METHOD.NLP
      expect(val).toBe("NLP")
    })
  })

  describe("REVIEW_STATUS", () => {
    it("contains exactly the 4 spec-defined members", () => {
      assertEnumShape(REVIEW_STATUS, [
        "PENDING_REVIEW",
        "AUTO_ACCEPTED",
        "CONFIRMED",
        "REJECTED",
      ])
    })

    it("values are usable as ReviewStatus type", () => {
      const val: ReviewStatus = REVIEW_STATUS.PENDING_REVIEW
      expect(val).toBe("PENDING_REVIEW")
    })
  })

  describe("CONDITION_TYPE", () => {
    it("contains all spec-defined members", () => {
      assertEnumShape(CONDITION_TYPE, [
        "HYPERTENSION",
        "DIABETES",
        "GENERAL",
        "ASTHMA",
        "CANCER",
        "KIDNEY_DISEASE",
        "HEART_DISEASE",
        "SICKLE_CELL",
        "HIV_AIDS",
        "EPILEPSY",
        "COPD",
        "ARTHRITIS",
        "MENTAL_HEALTH",
        "THYROID",
        "STROKE",
        "LIVER_DISEASE",
      ])
    })

    it("values are usable as ConditionType type", () => {
      const val: ConditionType = CONDITION_TYPE.DIABETES
      expect(val).toBe("DIABETES")
    })
  })

  describe("CONTENT_LOCALE", () => {
    it("contains exactly the 2 spec-defined members", () => {
      assertEnumShape(CONTENT_LOCALE, ["EN", "SW"])
    })

    it("values are usable as ContentLocale type", () => {
      const val: ContentLocale = CONTENT_LOCALE.SW
      expect(val).toBe("SW")
    })
  })

  describe("INTERACTION_SEVERITY", () => {
    it("contains exactly the 4 spec-defined members", () => {
      assertEnumShape(INTERACTION_SEVERITY, [
        "MILD",
        "MODERATE",
        "SEVERE",
        "CONTRAINDICATED",
      ])
    })

    it("values are usable as InteractionSeverity type", () => {
      const val: InteractionSeverity = INTERACTION_SEVERITY.CONTRAINDICATED
      expect(val).toBe("CONTRAINDICATED")
    })
  })

  describe("REFILL_STATUS", () => {
    it("contains exactly the 5 spec-defined members", () => {
      assertEnumShape(REFILL_STATUS, [
        "UPCOMING",
        "DUE",
        "OVERDUE",
        "REFILLED",
        "CANCELLED",
      ])
    })

    it("values are usable as RefillStatus type", () => {
      const val: RefillStatus = REFILL_STATUS.CANCELLED
      expect(val).toBe("CANCELLED")
    })
  })

  describe("EDUCATION_CONTENT_TYPE", () => {
    it("contains all spec-defined members plus implementation additions", () => {
      assertEnumShape(EDUCATION_CONTENT_TYPE, [
        "DIETARY",
        "EXERCISE",
        "MYTH_BUSTING",
        "EMOTIONAL",
        "SELF_MONITORING",
        "MILESTONE",
        "ACCEPTANCE",
      ])
    })

    it("values are usable as EducationContentType type", () => {
      const val: EducationContentType = EDUCATION_CONTENT_TYPE.DIETARY
      expect(val).toBe("DIETARY")
    })
  })

  describe("DELIVERY_CHANNEL", () => {
    it("contains exactly the 3 spec-defined members", () => {
      assertEnumShape(DELIVERY_CHANNEL, ["PUSH", "IN_APP", "BOTH"])
    })

    it("values are usable as DeliveryChannel type", () => {
      const val: DeliveryChannel = DELIVERY_CHANNEL.BOTH
      expect(val).toBe("BOTH")
    })
  })

  describe("STOCK_STATUS", () => {
    it("contains exactly the 3 spec-defined members", () => {
      assertEnumShape(STOCK_STATUS, [
        "IN_STOCK",
        "LOW_STOCK",
        "OUT_OF_STOCK",
      ])
    })

    it("values are usable as StockStatus type", () => {
      const val: StockStatus = STOCK_STATUS.OUT_OF_STOCK
      expect(val).toBe("OUT_OF_STOCK")
    })
  })

  describe("MEDICATION_LOAN_TRIGGER", () => {
    it("contains exactly the 3 spec-defined members", () => {
      assertEnumShape(MEDICATION_LOAN_TRIGGER, [
        "PREDICTIVE",
        "OVERDUE_REFILL",
        "PATIENT_REQUESTED",
      ])
    })

    it("values are usable as MedicationLoanTrigger type", () => {
      const val: MedicationLoanTrigger =
        MEDICATION_LOAN_TRIGGER.PATIENT_REQUESTED
      expect(val).toBe("PATIENT_REQUESTED")
    })
  })

  describe("MESSAGE_ROLE", () => {
    it("contains exactly the 3 spec-defined members", () => {
      assertEnumShape(MESSAGE_ROLE, ["USER", "ASSISTANT", "SYSTEM"])
    })

    it("values are usable as MessageRole type", () => {
      const val: MessageRole = MESSAGE_ROLE.SYSTEM
      expect(val).toBe("SYSTEM")
    })
  })

  describe("OVERALL_RISK", () => {
    it("contains exactly the 4 spec-defined members", () => {
      assertEnumShape(OVERALL_RISK, ["NONE", "LOW", "MODERATE", "HIGH"])
    })

    it("values are usable as OverallRisk type", () => {
      const val: OverallRisk = OVERALL_RISK.HIGH
      expect(val).toBe("HIGH")
    })
  })

  describe("SUGGESTED_ACTION_TYPE", () => {
    it("contains exactly the 4 spec-defined members", () => {
      assertEnumShape(SUGGESTED_ACTION_TYPE, [
        "PAY",
        "CHECK_STOCK",
        "APPLY_LOAN",
        "VIEW_CARD",
      ])
    })

    it("values are usable as SuggestedActionType type", () => {
      const val: SuggestedActionType = SUGGESTED_ACTION_TYPE.VIEW_CARD
      expect(val).toBe("VIEW_CARD")
    })
  })

  describe("cross-cutting enum guarantees", () => {
    const allEnums: Record<string, Record<string, string>> = {
      MEDICATION_CATEGORY,
      INVOICE_SOURCE_TYPE,
      PARSE_METHOD,
      REVIEW_STATUS,
      CONDITION_TYPE,
      CONTENT_LOCALE,
      INTERACTION_SEVERITY,
      REFILL_STATUS,
      EDUCATION_CONTENT_TYPE,
      DELIVERY_CHANNEL,
      STOCK_STATUS,
      MEDICATION_LOAN_TRIGGER,
      MESSAGE_ROLE,
      OVERALL_RISK,
      SUGGESTED_ACTION_TYPE,
    }

    it("all 15 enum objects are exported", () => {
      expect(Object.keys(allEnums)).toHaveLength(15)
      for (const enumObj of Object.values(allEnums)) {
        expect(enumObj).toBeDefined()
        expect(typeof enumObj).toBe("object")
      }
    })

    it("no enum object is empty", () => {
      for (const [_name, enumObj] of Object.entries(allEnums)) {
        expect(Object.keys(enumObj).length).toBeGreaterThan(0)
      }
    })

    it("all values across all enums are uppercase strings", () => {
      for (const [_name, enumObj] of Object.entries(allEnums)) {
        for (const [_key, value] of Object.entries(enumObj)) {
          expect(typeof value).toBe("string")
          expect(value).toBe(value.toUpperCase())
        }
      }
    })

    it("key-value identity holds for every member of every enum", () => {
      for (const enumObj of Object.values(allEnums)) {
        for (const [key, value] of Object.entries(enumObj)) {
          expect(key).toBe(value)
        }
      }
    })
  })
})
