import { describe, it, expect } from "vitest"
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
      ]
      expect(statuses).toHaveLength(4)
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
