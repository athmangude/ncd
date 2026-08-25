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
} from "./care-companion"

// ---------------------------------------------------------------------------
// Helper: compile-time assertion that a value satisfies a type.
// If the type definition changes in a way that breaks conformance, the test
// file will fail to compile — which surfaces the regression immediately.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Fixtures — realistic data modelled after what the Jireh backend returns.
// Each fixture doubles as a compile-time check (TS rejects non-conforming
// shapes) and a runtime check (we assert on key structural properties).
// ---------------------------------------------------------------------------

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
  medication,
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
}

const medicationInteraction: MedicationInteraction = {
  id: "mi-001",
  medicationA: "Metformin",
  medicationB: "Lisinopril",
  herbName: null,
  severity: "MILD",
  description: "Minor interaction between Metformin and Lisinopril.",
  clinicalEffect: "May slightly increase hypoglycemia risk.",
  recommendation: "Monitor blood sugar more frequently.",
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
  maxAmount: "5000.00",
  medications: [{ name: "Metformin 500mg", estimatedCost: "450.00" }],
  targetPharmacy: { id: 42, name: "MedPlus Pharmacy Westlands" },
  reason: "Good repayment history and active savings.",
  expiresAt: "2026-09-25T00:00:00Z",
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
}

// ---------------------------------------------------------------------------
// Tests
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
    it("contains nested Medication reference", () => {
      expect(medicationCard.medication.genericName).toBe("Metformin")
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

    it("supports herb-medication interactions (medicationB null, herbName set)", () => {
      const herbInteraction: MedicationInteraction = {
        ...medicationInteraction,
        medicationB: null,
        herbName: "St. John's Wort",
      }
      expect(herbInteraction.medicationB).toBeNull()
      expect(herbInteraction.herbName).toBe("St. John's Wort")
    })

    it("supports drug-drug interactions (herbName null, medicationB set)", () => {
      expect(medicationInteraction.medicationB).toBe("Lisinopril")
      expect(medicationInteraction.herbName).toBeNull()
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
    it("stores monetary values as strings", () => {
      expect(typeof medicationLoanPreApproval.maxAmount).toBe("string")
      expect(typeof medicationLoanPreApproval.medications[0].estimatedCost).toBe(
        "string",
      )
    })

    it("has a target pharmacy with numeric id", () => {
      expect(typeof medicationLoanPreApproval.targetPharmacy.id).toBe("number")
      expect(typeof medicationLoanPreApproval.targetPharmacy.name).toBe(
        "string",
      )
    })

    it("has a boolean pre-approval flag", () => {
      expect(typeof medicationLoanPreApproval.isPreApproved).toBe("boolean")
    })

    it("represents a declined pre-approval", () => {
      const declined: MedicationLoanPreApproval = {
        ...medicationLoanPreApproval,
        isPreApproved: false,
        maxAmount: "0.00",
        medications: [],
        reason: "Insufficient credit history.",
      }
      expect(declined.isPreApproved).toBe(false)
      expect(declined.medications).toHaveLength(0)
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

  describe("all 17 exports are importable", () => {
    it("imports all interfaces and types without error", () => {
      // This test verifies that every exported type from care-companion.ts
      // can be referenced. If an export is removed or renamed, this test
      // will fail at compile time (TS error) before it even runs.
      const typeChecks: Record<string, unknown> = {
        Medication: medication,
        PatientMedication: patientMedication,
        TimelineEntry: timelineEntry,
        CostSummary: costSummary,
        CostCategoryBreakdown: costCategoryBreakdown,
        EmergencyCard: emergencyCard,
        MedicationCard: medicationCard,
        MedicationInteraction: medicationInteraction,
        RefillSchedule: refillSchedule,
        EducationContentCard: educationContentCard,
        PharmacyStock: pharmacyStock,
        MedicationLoanPreApproval: medicationLoanPreApproval,
        EmergencyTransportCredit: emergencyTransportCredit,
        AssistantMessage: assistantMessage,
        CareCompanionHome: careCompanionHome,
        CareCompanionProfile: careCompanionProfile,
      }
      // EducationContentType is a type alias, verified via the card fixture
      expect(Object.keys(typeChecks)).toHaveLength(16)
    })
  })
})

// ---------------------------------------------------------------------------
// Enum const object tests
// ---------------------------------------------------------------------------
// These tests verify that each `as const` object:
//   1. Is exported and importable at runtime (not just a type)
//   2. Contains exactly the members defined in the spec
//   3. Has key-value identity (each key maps to a string equal to itself)
//   4. Is not accidentally mutated or extended
// ---------------------------------------------------------------------------

describe("care-companion enum const objects", () => {
  /**
   * Helper: given an enum const object and the expected set of string values,
   * assert that the object has exactly those keys, each mapping to itself.
   */
  function assertEnumShape(
    enumObj: Record<string, string>,
    expectedValues: string[],
  ) {
    const keys = Object.keys(enumObj)
    const values = Object.values(enumObj)

    // Correct member count
    expect(keys).toHaveLength(expectedValues.length)
    expect(values).toHaveLength(expectedValues.length)

    // Every expected value is present as both a key and a value
    for (const val of expectedValues) {
      expect(enumObj).toHaveProperty(val, val)
    }

    // No extra keys beyond the expected set
    for (const key of keys) {
      expect(expectedValues).toContain(key)
    }

    // Key-value identity: each key equals its own value
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
    it("contains exactly the 3 spec-defined members", () => {
      assertEnumShape(CONDITION_TYPE, [
        "HYPERTENSION",
        "DIABETES",
        "GENERAL",
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
      // Spec defines 5: DIETARY, MYTH_BUSTING, EMOTIONAL, SELF_MONITORING, MILESTONE
      // Implementation adds EXERCISE and ACCEPTANCE (7 total)
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
    }

    it("all 13 enum objects are exported", () => {
      expect(Object.keys(allEnums)).toHaveLength(13)
      for (const enumObj of Object.values(allEnums)) {
        expect(enumObj).toBeDefined()
        expect(typeof enumObj).toBe("object")
      }
    })

    it("no enum object is empty", () => {
      for (const [name, enumObj] of Object.entries(allEnums)) {
        expect(Object.keys(enumObj).length).toBeGreaterThan(
          0,
          // Template literal for diagnostic message if this ever fails
        )
      }
    })

    it("all values across all enums are uppercase strings", () => {
      for (const [name, enumObj] of Object.entries(allEnums)) {
        for (const [key, value] of Object.entries(enumObj)) {
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
