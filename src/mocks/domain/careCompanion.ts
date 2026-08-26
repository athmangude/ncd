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
  CareCompanionEvent,
  PaymentEvent,
  CashbackEarnedEvent,
  CircleInviteSentEvent,
  CircleInviteAcceptedEvent,
  DrugInteractionDetectedEvent,
  JirehPlusStatusChangeEvent,
  LoanDisbursedEvent,
  LoanRepaymentEvent,
  LlmActionEvent,
  InteractionSeverity,
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
// Static fixture no longer used — notifications are seeded dynamically from intake profile
// import careCompanionNotificationsSeed from "../fixtures/care-companion-notifications.json"

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

const DAY_MS = 86_400_000

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
  if (profile.treatment?.medicationNames?.length) {
    seedFromIntakeMedications(profile.treatment.medicationNames)
  }
  seedNotificationsFromIntake(profile)
  return profile
}

const MONTHLY_PRICE_KES: Record<string, number> = {
  // DIABETES
  "metformin": 450,
  "glibenclamide": 280,
  "insulin glargine": 3200,
  "gliclazide": 480,
  "pioglitazone": 620,
  "hba1c test": 1800,
  // HYPERTENSION
  "amlodipine": 380,
  "losartan": 650,
  "hydrochlorothiazide": 180,
  "enalapril": 380,
  "nifedipine": 420,
  "lisinopril": 400,
  "metoprolol": 320,
  "furosemide": 200,
  // GENERAL
  "atorvastatin": 520,
  "aspirin": 150,
  "simvastatin": 380,
  "omeprazole": 350,
  // ASTHMA
  "salbutamol": 650,
  "beclomethasone": 850,
  "montelukast": 720,
  "peak flow test": 500,
  // CANCER
  "tamoxifen": 1200,
  "capecitabine": 15000,
  "imatinib": 45000,
  // KIDNEY_DISEASE
  "erythropoietin": 8500,
  "calcium carbonate": 250,
  "creatinine test": 800,
  // HEART_DISEASE
  "digoxin": 350,
  "warfarin": 280,
  "clopidogrel": 550,
  "isosorbide mononitrate": 480,
  // SICKLE_CELL
  "hydroxyurea": 1800,
  "folic acid": 120,
  "full blood count": 600,
  // HIV_AIDS
  "tld (tenofovir/lamivudine/dolutegravir)": 0,
  "nevirapine": 0,
  "cd4 count test": 1500,
  "viral load test": 3500,
  // EPILEPSY
  "carbamazepine": 350,
  "sodium valproate": 650,
  "phenytoin": 280,
  "phenobarbital": 180,
  // COPD
  "tiotropium": 2200,
  "ipratropium": 950,
  "prednisolone": 300,
  // ARTHRITIS
  "diclofenac": 250,
  "methotrexate": 800,
  "ibuprofen": 200,
  "celecoxib": 1200,
  // MENTAL_HEALTH
  "fluoxetine": 350,
  "amitriptyline": 180,
  "haloperidol": 250,
  "diazepam": 200,
  // THYROID
  "levothyroxine": 350,
  "carbimazole": 450,
  "thyroid function test": 2500,
  // STROKE
  "physiotherapy session": 2000,
  // LIVER_DISEASE
  "tenofovir": 1500,
  "ursodeoxycholic acid": 2800,
  "liver function test": 1200,
  // DIABETES (new)
  "glimepiride": 380,
  "insulin soluble": 1800,
  "insulin nph": 1600,
  "empagliflozin": 3500,
  "dapagliflozin": 3200,
  "sitagliptin": 2800,
  "vildagliptin": 2500,
  "insulin mixtard": 1900,
  "repaglinide": 650,
  "fasting blood sugar test": 300,
  "random blood sugar test": 250,
  "oral glucose tolerance test": 1200,
  "renal function test": 1500,
  // HYPERTENSION (new)
  "valsartan": 750,
  "telmisartan": 680,
  "candesartan": 800,
  "spironolactone": 450,
  "atenolol": 250,
  "propranolol": 200,
  "prazosin": 350,
  "carvedilol": 550,
  "indapamide": 380,
  "perindopril": 620,
  "ramipril": 500,
  "doxazosin": 480,
  "bendroflumethiazide": 180,
  "blood pressure monitor": 4500,
  // HIV_AIDS (new)
  "atazanavir/ritonavir": 0,
  "lopinavir/ritonavir": 0,
  "efavirenz": 0,
  "abacavir/lamivudine": 0,
  "zidovudine": 0,
  "darunavir": 0,
  "raltegravir": 0,
  "cotrimoxazole": 120,
  "fluconazole": 350,
  // ASTHMA (new)
  "budesonide": 1200,
  "fluticasone": 1500,
  "salmeterol": 1800,
  "formoterol": 1600,
  "aminophylline": 250,
  "theophylline": 300,
  "budesonide/formoterol": 2800,
  "fluticasone/salmeterol": 3200,
  "cromoglycate": 800,
  "chest x-ray": 2500,
  // EPILEPSY (new)
  "levetiracetam": 2200,
  "lamotrigine": 1500,
  "clonazepam": 350,
  "topiramate": 1800,
  "gabapentin": 1200,
  "clobazam": 450,
  "eeg test": 5000,
  // MENTAL_HEALTH (new)
  "risperidone": 350,
  "chlorpromazine": 180,
  "sertraline": 450,
  "escitalopram": 550,
  "lorazepam": 280,
  "olanzapine": 650,
  "quetiapine": 800,
  "lithium carbonate": 600,
  "clomipramine": 450,
  "trazodone": 500,
  "paroxetine": 520,
  "alprazolam": 300,
  "fluphenazine decanoate": 1200,
  "psychiatric consultation": 5000,
  // ARTHRITIS (new)
  "naproxen": 300,
  "hydroxychloroquine": 850,
  "sulfasalazine": 650,
  "colchicine": 400,
  "allopurinol": 280,
  "indomethacin": 250,
  "leflunomide": 2500,
  "adalimumab": 65000,
  "esr test": 500,
  "uric acid test": 600,
  "rheumatoid factor test": 1500,
  "x-ray joints": 3000,
  // HEART_DISEASE (new)
  "amiodarone": 1200,
  "glyceryl trinitrate": 850,
  "diltiazem": 550,
  "verapamil": 450,
  "bisoprolol": 420,
  "ivabradine": 3500,
  "sacubitril/valsartan": 8500,
  "ranolazine": 4200,
  "ecg test": 1500,
  "echocardiogram": 8000,
  "lipid profile test": 1200,
  "troponin test": 2500,
  "bnp test": 3500,
  // CANCER (new)
  "cyclophosphamide": 2500,
  "anastrozole": 3500,
  "letrozole": 2800,
  "cisplatin": 8000,
  "5-fluorouracil": 3500,
  "doxorubicin": 12000,
  "vincristine": 5000,
  "paclitaxel": 25000,
  "carboplatin": 15000,
  "etoposide": 4500,
  "morphine": 800,
  "tramadol": 450,
  "ct scan": 15000,
  "biopsy": 12000,
  "tumour marker test": 3500,
  "cbc with differential": 800,
  // KIDNEY_DISEASE (new)
  "ferrous sulphate": 150,
  "alfacalcidol": 1200,
  "sodium bicarbonate": 180,
  "sodium polystyrene sulfonate": 2500,
  "sevelamer": 8500,
  "darbepoetin": 12000,
  "peritoneal dialysis fluid": 3500,
  "haemodialysis session": 8000,
  "urea test": 500,
  "electrolyte panel": 800,
  "kidney ultrasound": 5000,
  // COPD (new)
  "azithromycin": 650,
  "roflumilast": 3500,
  "oxygen concentrator": 35000,
  "spirometry test": 3000,
  "sputum culture": 1500,
  // THYROID (new)
  "propylthiouracil": 500,
  "lugol's iodine": 300,
  "radioactive iodine treatment": 25000,
  "thyroid ultrasound": 5000,
  "t3/t4 test": 2000,
  // STROKE (new)
  "dipyridamole": 650,
  "nimodipine": 2500,
  "enoxaparin": 3500,
  "alteplase": 180000,
  "ct brain scan": 12000,
  "mri brain": 25000,
  "carotid doppler": 8000,
  "speech therapy session": 3000,
  "occupational therapy session": 3000,
  // LIVER_DISEASE (new)
  "lactulose": 450,
  "rifaximin": 4500,
  "vitamin k": 350,
  "albumin iv": 8000,
  "hepatitis b vaccine": 1500,
  "abdominal ultrasound": 4000,
  "afp test": 2000,
  "hepatitis b surface antigen test": 1200,
  "hepatitis c antibody test": 1500,
  "fibroscan": 12000,
  // SICKLE_CELL (new)
  "penicillin v": 120,
  "l-glutamine": 3500,
  "deferasirox": 8000,
  "blood transfusion": 15000,
  "pneumococcal vaccine": 3500,
  "reticulocyte count": 800,
  "haemoglobin electrophoresis": 2500,
  "transcranial doppler": 8000,
}

const FACILITIES = [
  "Mombasa Hospital Pharmacy",
  "City Chemist Mombasa",
  "Likoni Health Centre",
  "Aga Khan Pharmacy",
  "Naivas Pharmacy Mombasa",
]

const MIN_CONSULTATION_FEE = 500
const MAX_CONSULTATION_FEE = 3000

function facilityConsultationFee(facilityName: string): number {
  let hash = 0
  for (let c = 0; c < facilityName.length; c++) {
    hash = ((hash << 5) - hash + facilityName.charCodeAt(c)) | 0
  }
  return (
    MIN_CONSULTATION_FEE +
    (Math.abs(hash) % (MAX_CONSULTATION_FEE - MIN_CONSULTATION_FEE + 1))
  )
}

function computeProjectedMonthlyCosts(
  profile: CareCompanionProfile,
): { month: string; medications: number; tests: number; consultations: number; total: number }[] {
  const projections: { month: string; medications: number; tests: number; consultations: number; total: number }[] = []
  const today = new Date()

  for (let i = 0; i < 6; i++) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const monthStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}`
    const monthStart = targetDate.getTime()
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getTime()

    let medTotal = 0
    for (const med of profile.costEstimates?.medications ?? []) {
      const freqMs = med.refillFrequencyDays * DAY_MS
      if (freqMs <= 0) continue
      let cursor = today.getTime()
      while (cursor <= monthEnd) {
        if (cursor >= monthStart && cursor <= monthEnd) {
          medTotal += med.estimatedCostPerRefill
        }
        cursor += freqMs
      }
    }

    let testTotal = 0
    let testCount = 0
    for (const test of profile.costEstimates?.tests ?? []) {
      const freqMs = test.frequencyMonths * 30 * DAY_MS
      if (freqMs <= 0) continue
      let cursor = today.getTime()
      while (cursor <= monthEnd) {
        if (cursor >= monthStart && cursor <= monthEnd) {
          testTotal += test.estimatedCostPerTest
          testCount += 1
        }
        cursor += freqMs
      }
    }

    const consultTotal = testCount * facilityConsultationFee("Nairobi Hospital")
    projections.push({
      month: monthStr,
      medications: Math.round(medTotal),
      tests: Math.round(testTotal),
      consultations: Math.round(consultTotal),
      total: Math.round(medTotal + testTotal + consultTotal),
    })
  }

  return projections
}

function seedFromIntakeMedications(medicationNames: string[]): void {
  const taxonomy = readCollection<MedicationTaxonomyEntry>(
    MEDICATION_TAXONOMY_KEY,
    medicationTaxonomySeed as unknown as MedicationTaxonomyEntry[],
  )

  const now = Date.now()
  const todayStr = new Date(now).toISOString().slice(0, 10)

  const schedules: RefillSchedule[] = []
  const patientMeds: PatientMedication[] = []
  const cards: MedicationCard[] = []
  const timeline: TimelineEntry[] = []
  let consultSpend = 0
  let consultTxns = 0
  const existingCards = readCollection<MedicationCard>(
    MEDICATION_CARDS_KEY,
    medicationCardsSeed as unknown as MedicationCard[],
  )

  medicationNames.forEach((name, i) => {
    const taxEntry = taxonomy.find(
      (t) => t.genericName.toLowerCase() === name.toLowerCase(),
    )
    const medId = taxEntry?.id ?? `custom-${name.toLowerCase().replace(/\s+/g, "-")}`
    const isLabTest = taxEntry?.category === "LAB_TEST"
    const monthlyPrice = MONTHLY_PRICE_KES[name.toLowerCase()] ?? 400
    const strength = taxEntry?.strengths?.[0] ?? null
    const refillInterval = isLabTest ? 90 : 30

    const daysUntil = 7 + i * 10
    schedules.push({
      id: `refill-intake-${i}`,
      medicationName: name,
      expectedRefillDate: new Date(now + daysUntil * DAY_MS)
        .toISOString()
        .slice(0, 10),
      status: "UPCOMING" as const,
      daysUntilRefill: daysUntil,
      estimatedDaysSupply: refillInterval,
      escalatedToLoanOffer: false,
    })

    const monthsOfHistory = 6
    const purchaseCount = Math.max(1, Math.floor((monthsOfHistory * 30) / refillInterval))
    const firstPurchaseDate = new Date(now - monthsOfHistory * 30 * DAY_MS)
    patientMeds.push({
      id: `pm-intake-${i}`,
      medication: {
        id: medId,
        genericName: taxEntry?.genericName ?? name,
        brandNames: taxEntry?.brandNames ?? [],
        strengths: taxEntry?.strengths ?? [],
        category: taxEntry?.category ?? "MEDICATION",
        conditionTags: taxEntry?.conditionTags ?? [],
      },
      firstPurchaseDate: firstPurchaseDate.toISOString().slice(0, 10),
      lastPurchaseDate: todayStr,
      totalPurchaseCount: purchaseCount,
      averageRefillIntervalDays: refillInterval,
      isActive: true,
      inferredConditions: taxEntry?.conditionTags ?? [],
    } as unknown as PatientMedication)

    for (let m = 0; m < purchaseCount; m++) {
      const purchaseDate = new Date(now - (purchaseCount - m) * refillInterval * DAY_MS)
      const variation = 0.9 + (((i * 7 + m * 3) % 10) / 50)
      const price = Math.round(monthlyPrice * variation)
      const facility = FACILITIES[(i + m) % FACILITIES.length]
      timeline.push({
        date: purchaseDate.toISOString().slice(0, 10),
        medicationName: strength ? `${name} ${strength}` : name,
        dosage: strength,
        quantity: isLabTest ? 1 : 30,
        lineTotal: `${price}.00`,
        facilityName: facility,
        gapDaysFromPrevious: m === 0 ? null : refillInterval,
        isGapAnomaly: false,
      })

      if (isLabTest) {
        const consultFee = facilityConsultationFee(facility)
        consultSpend += consultFee
        consultTxns += 1
        timeline.push({
          date: purchaseDate.toISOString().slice(0, 10),
          medicationName: "Doctor consultation",
          dosage: null,
          quantity: 1,
          lineTotal: `${consultFee}.00`,
          facilityName: facility,
          gapDaysFromPrevious: null,
          isGapAnomaly: false,
        })
      }
    }

    const hasCard = existingCards.some((c) => c.medicationId === medId)
    if (!hasCard) {
      cards.push({
        id: `mc-intake-${i}`,
        medicationId: medId,
        locale: "EN" as ContentLocale,
        description: `${name} is a medication prescribed for managing your condition.`,
        howItWorks: `${name} works by helping control your symptoms. Ask your doctor or pharmacist for detailed information.`,
        commonSideEffects: [
          { effect: "Consult your doctor about possible side effects", frequency: "Varies", advice: "Your pharmacist can provide more information." },
        ],
        seriousSideEffects: [
          { effect: "Seek medical attention if you experience severe symptoms", action: "Contact your doctor or go to the nearest hospital." },
        ],
        avoidanceWarnings: [],
        whenToSeekHelp: "Contact your doctor if side effects persist or if you experience any unusual symptoms.",
        storageInstructions: "Store at room temperature away from moisture and heat.",
      } as unknown as MedicationCard)
    }
  })

  timeline.sort((a, b) => b.date.localeCompare(a.date))

  const ytdSpend = timeline.reduce((sum, e) => sum + parseFloat(e.lineTotal), 0)
  const currentMonth = new Date(now).getMonth() + 1
  const monthlyAverage = currentMonth > 0 ? Math.round(ytdSpend / currentMonth) : 0
  const cashbackEarned = Math.round(ytdSpend * 0.05)
  const annualProjection = Math.round(monthlyAverage * 12)

  const medSpend = timeline
    .filter(
      (e) =>
        !e.medicationName.toLowerCase().includes("test") &&
        e.medicationName !== "Doctor consultation",
    )
    .reduce((s, e) => s + parseFloat(e.lineTotal), 0)
  const labSpend = ytdSpend - medSpend - consultSpend
  const medTxns = timeline.filter(
    (e) =>
      !e.medicationName.toLowerCase().includes("test") &&
      e.medicationName !== "Doctor consultation",
  ).length
  const labTxns = timeline.length - medTxns - consultTxns

  const monthlyBuckets: Record<number, number> = {}
  for (const entry of timeline) {
    const m = new Date(entry.date).getMonth() + 1
    monthlyBuckets[m] = (monthlyBuckets[m] ?? 0) + parseFloat(entry.lineTotal)
  }
  const monthlyTrend: MonthlySpend[] = []
  for (let m = 1; m <= currentMonth; m++) {
    monthlyTrend.push({
      month: m,
      spend: `${Math.round(monthlyBuckets[m] ?? 0)}.00`,
    })
  }

  const costSummary = {
    year: new Date(now).getFullYear(),
    ytdSpend: `${Math.round(ytdSpend)}`,
    monthlyAverage: `${monthlyAverage}`,
    cashbackEarned: `${cashbackEarned}`,
    netSpend: `${Math.round(ytdSpend - cashbackEarned)}`,
    annualProjection: `${annualProjection}`,
    transactionCount: timeline.length,
    currency: "KES" as const,
    breakdown: [
      { category: "MEDICATION", totalSpend: `${Math.round(medSpend)}`, percentage: Math.round((medSpend / ytdSpend) * 100) || 0, transactionCount: medTxns },
      ...(labSpend > 0 ? [{ category: "LAB_TEST", totalSpend: `${Math.round(labSpend)}`, percentage: Math.round((labSpend / ytdSpend) * 100), transactionCount: labTxns }] : []),
      ...(consultSpend > 0 ? [{ category: "CONSULTATION", totalSpend: `${Math.round(consultSpend)}`, percentage: Math.round((consultSpend / ytdSpend) * 100), transactionCount: consultTxns }] : []),
    ],
    monthlyTrend,
  }

  const categories = costSummary.breakdown.map((b) => ({
    category: b.category,
    totalSpend: b.totalSpend + ".00",
    percentage: b.percentage,
    transactionCount: b.transactionCount,
  }))

  const costBreakdown = {
    year: costSummary.year,
    categories,
    monthlyTrend,
    pagination: { total: monthlyTrend.length, limit: 12, offset: 0 },
  }

  // -------------------------------------------------------------------------
  // Generate payment + cashback events from the timeline
  // -------------------------------------------------------------------------
  const FUNDING_SOURCES: PaymentEvent["fundingSources"][0]["type"][] = [
    "WALLET", "MPESA", "CASHBACK", "CARE_SAVER",
  ]
  const events: CareCompanionEvent[] = []
  let runningCashback = 0

  const timelineByDate: Record<string, TimelineEntry[]> = {}
  for (const entry of timeline) {
    ;(timelineByDate[entry.date] ??= []).push(entry)
  }

  for (const [date, entries] of Object.entries(timelineByDate)) {
    const facility = entries[0].facilityName
    const total = entries.reduce((s, e) => s + parseFloat(e.lineTotal), 0)
    const paymentId = `pay-${date}-${facility.slice(0, 8).replace(/\s/g, "")}`

    const lineItems: PaymentEvent["lineItems"] = entries.map((e) => {
      const isConsult = e.medicationName === "Doctor consultation"
      const isTest = e.medicationName.toLowerCase().includes("test")
      const cat = isConsult
        ? "CONSULTATION" as const
        : isTest
          ? "LAB_TEST" as const
          : "MEDICATION" as const
      return {
        name: e.medicationName,
        category: cat,
        quantity: e.quantity ?? 1,
        unitPrice: parseFloat(e.lineTotal) / (e.quantity ?? 1),
        lineTotal: parseFloat(e.lineTotal),
      }
    })

    const primaryIdx = (date.charCodeAt(8) + date.charCodeAt(9)) % FUNDING_SOURCES.length
    const primaryType = FUNDING_SOURCES[primaryIdx]
    const fundingSources: PaymentEvent["fundingSources"] = [
      { type: primaryType, amount: Math.round(total * 0.8) },
      { type: "MPESA" as const, amount: Math.round(total * 0.2) },
    ]
    if (primaryType === "MPESA") {
      fundingSources.length = 0
      fundingSources.push({ type: "MPESA", amount: total })
    }

    const payEvent: PaymentEvent = {
      id: paymentId,
      type: "PAYMENT",
      timestamp: new Date(date + "T10:00:00").toISOString(),
      source: "user",
      facilityName: facility,
      facilityType: facility.toLowerCase().includes("hospital")
        ? "HOSPITAL"
        : facility.toLowerCase().includes("lab") || facility.toLowerCase().includes("pathol")
          ? "LAB"
          : "PHARMACY",
      totalAmount: total,
      currency: "KES",
      lineItems,
      fundingSources,
      isInNetwork: (date.charCodeAt(9) % 3) !== 0,
    }
    events.push(payEvent)

    const cbRate = 0.05
    const cbAmount = Math.round(total * cbRate)
    runningCashback += cbAmount
    const cbEvent: CashbackEarnedEvent = {
      id: `cb-${paymentId}`,
      type: "CASHBACK_EARNED",
      timestamp: new Date(date + "T10:05:00").toISOString(),
      source: "system",
      paymentEventId: paymentId,
      amount: cbAmount,
      currency: "KES",
      rate: cbRate,
      newBalance: runningCashback,
    }
    events.push(cbEvent)
  }

  // -------------------------------------------------------------------------
  // Generate circle membership events from existing network data
  // -------------------------------------------------------------------------
  const CIRCLE_NAMES = [
    { first: "Sarah", last: "Wanjiku", rel: "Sister", phone: "+254712345001" },
    { first: "James", last: "Omondi", rel: "Brother", phone: "+254712345002" },
    { first: "Grace", last: "Achieng", rel: "Friend", phone: "+254712345003" },
  ]
  const circleMembers: CareCompanionProfile["accountData"] extends infer T
    ? T extends { circleMembers: infer C } ? C : never : never = []

  CIRCLE_NAMES.forEach((person, idx) => {
    const inviteDate = new Date(now - (90 + idx * 15) * DAY_MS)
    const acceptDate = new Date(inviteDate.getTime() + (2 + idx) * DAY_MS)
    const slotType = idx < 2
      ? "ACCOUNTABLE" as const
      : "AUXILIARY" as const

    const inviteEvent: CircleInviteSentEvent = {
      id: `circle-invite-${idx}`,
      type: "CIRCLE_INVITE_SENT",
      timestamp: inviteDate.toISOString(),
      source: "user",
      inviteeFirstName: person.first,
      inviteeLastName: person.last,
      inviteePhone: person.phone,
      relationship: person.rel,
      slotType,
    }
    events.push(inviteEvent)

    const acceptEvent: CircleInviteAcceptedEvent = {
      id: `circle-accept-${idx}`,
      type: "CIRCLE_INVITE_ACCEPTED",
      timestamp: acceptDate.toISOString(),
      source: idx === 2 ? "llm" : "system",
      memberId: `member-${idx}`,
      memberFirstName: person.first,
      memberLastName: person.last,
      relationship: person.rel,
      slotType,
    }
    events.push(acceptEvent)

    circleMembers.push({
      id: `member-${idx}`,
      firstName: person.first,
      lastName: person.last,
      relationship: person.rel,
      status: "ACTIVE",
      slotType,
      joinedAt: acceptDate.toISOString().slice(0, 10),
    })
  })

  // -------------------------------------------------------------------------
  // Drug interaction events from fixture data
  // -------------------------------------------------------------------------
  const currentProfile = getCareCompanionProfile()
  const interactionFixtures = getMedicationInteractions()
  const patientMedNamesLower = new Set(medicationNames.map((n) => n.toLowerCase()))
  const taxLookup = readCollection<MedicationTaxonomyEntry>(
    MEDICATION_TAXONOMY_KEY,
    medicationTaxonomySeed as unknown as MedicationTaxonomyEntry[],
  )

  let ixIdx = 0
  for (const ix of interactionFixtures) {
    const medA = taxLookup.find((t) => t.id === ix.medicationAId)
    const medB = ix.medicationBId
      ? taxLookup.find((t) => t.id === ix.medicationBId)
      : null
    const nameA = medA?.genericName?.toLowerCase()
    const nameB = medB?.genericName?.toLowerCase()
    const matchA = nameA && patientMedNamesLower.has(nameA)
    const matchB = nameB && patientMedNamesLower.has(nameB)
    const matchHerb = ix.herbName && currentProfile?.treatment.usingHerbalAlternatives

    if ((matchA && matchB) || (matchA && matchHerb)) {
      events.push({
        id: `evt-ix-${ixIdx++}`,
        type: "DRUG_INTERACTION_DETECTED",
        timestamp: new Date(now - 7 * DAY_MS).toISOString(),
        source: "system",
        medicationA: medA?.genericName ?? ix.medicationAId,
        medicationB: medB?.genericName ?? null,
        herbName: ix.herbName,
        severity: ix.severity as InteractionSeverity,
        clinicalEffect: ix.clinicalEffect,
        recommendation: ix.recommendation,
      } satisfies DrugInteractionDetectedEvent)
    }
  }

  // -------------------------------------------------------------------------
  // Jireh Plus activation event
  // -------------------------------------------------------------------------
  events.push({
    id: "evt-plus-activate",
    type: "JIREH_PLUS_STATUS_CHANGE",
    timestamp: new Date(now - 120 * DAY_MS).toISOString(),
    source: "user",
    newStatus: "ACTIVE",
    previousStatus: null,
  } satisfies JirehPlusStatusChangeEvent)

  // -------------------------------------------------------------------------
  // Loan events: 1 disbursement + 2 on-time repayments
  // -------------------------------------------------------------------------
  const loanDisbursedAt = new Date(now - 30 * DAY_MS)
  const loanId = "loan-001"
  const loanAmount = 5000
  const totalRepayments = 30
  const repaymentAmount = Math.ceil(loanAmount / totalRepayments)

  events.push({
    id: "evt-loan-disbursed",
    type: "LOAN_DISBURSED",
    timestamp: loanDisbursedAt.toISOString(),
    source: "user",
    loanId,
    amount: loanAmount,
    currency: "KES",
    purpose: "Medication refill",
    targetFacility: "Kenyatta National Hospital",
    medications: medicationNames.slice(0, 2),
    repaymentSchedule: {
      totalRepayments,
      amountPerRepayment: repaymentAmount,
      cadence: "DAILY",
      firstDueDate: new Date(loanDisbursedAt.getTime() + DAY_MS)
        .toISOString()
        .slice(0, 10),
    },
  } satisfies LoanDisbursedEvent)

  const loanRepaymentsMade = 2
  for (let rIdx = 0; rIdx < loanRepaymentsMade; rIdx++) {
    const repayDate = new Date(
      loanDisbursedAt.getTime() + (rIdx + 1) * DAY_MS,
    )
    events.push({
      id: `evt-loan-repay-${rIdx}`,
      type: "LOAN_REPAYMENT",
      timestamp: repayDate.toISOString(),
      source: "user",
      loanId,
      amount: repaymentAmount,
      currency: "KES",
      method: rIdx === 0 ? "MPESA" : "M_RATIBA",
      outstandingBalance:
        loanAmount - repaymentAmount * (rIdx + 1),
      isOnTime: true,
      repaymentNumber: rIdx + 1,
      totalRepayments,
    } satisfies LoanRepaymentEvent)
  }

  // -------------------------------------------------------------------------
  // Recent payments with empty lineItems (for LLM invoice population)
  // -------------------------------------------------------------------------
  const recentPaymentFacilities = [
    { name: "Nairobi Hospital Pharmacy", type: "PHARMACY" as const, amount: 4200 },
    { name: "Lancet Pathologists", type: "LAB" as const, amount: 2800 },
  ]
  recentPaymentFacilities.forEach((f, idx) => {
    const daysAgo = idx === 0 ? 2 : 5
    const payId = `pay-recent-${idx}`
    events.push({
      id: payId,
      type: "PAYMENT",
      timestamp: new Date(now - daysAgo * DAY_MS).toISOString(),
      source: "user",
      facilityName: f.name,
      facilityType: f.type,
      totalAmount: f.amount,
      currency: "KES",
      lineItems: [],
      fundingSources: [{ type: "MPESA", amount: f.amount }],
      isInNetwork: true,
    } satisfies PaymentEvent)
  })

  events.sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  writeCollection(REFILL_SCHEDULES_KEY, schedules)
  writeCollection(PATIENT_MEDICATIONS_KEY, patientMeds)
  writeCollection(
    MEDICATION_CARDS_KEY,
    [...existingCards.filter((c) =>
      patientMeds.some((pm) => pm.medication.id === c.medicationId),
    ), ...cards],
  )
  writeCollection(CARE_COMPANION_TIMELINE_KEY, timeline)
  writeObject(COST_SUMMARY_KEY, costSummary)
  writeObject(COST_BREAKDOWN_KEY, costBreakdown)
  writeCollection(EVENTS_LOG_KEY, events)

  // Patch accountData onto the profile
  const savedProfile = getCareCompanionProfile()
  if (savedProfile) {
    const withAccount: CareCompanionProfile = {
      ...savedProfile,
      accountData: {
        cashbackBalance: runningCashback,
        jirehPlusStatus: "ACTIVE",
        jirehPlusSince: new Date(now - 120 * DAY_MS).toISOString().slice(0, 10),
        circleMembers,
        totalCashbackEarned: runningCashback,
        totalCashbackShared: 0,
        projectedMonthlyCosts: [],
        activeLoan: {
          loanId,
          originalAmount: loanAmount,
          outstandingBalance:
            loanAmount - repaymentAmount * loanRepaymentsMade,
          nextRepaymentDate: new Date(
            loanDisbursedAt.getTime() + (loanRepaymentsMade + 1) * DAY_MS,
          )
            .toISOString()
            .slice(0, 10),
          nextRepaymentAmount: repaymentAmount,
          repaymentsCompleted: loanRepaymentsMade,
          totalRepayments,
          isOverdue: false,
        },
        creditLimit: 10000,
        repaymentStreak: loanRepaymentsMade,
        totalLoansCompleted: 0,
      },
    }
    withAccount.accountData!.projectedMonthlyCosts =
      computeProjectedMonthlyCosts(withAccount)
    writeObject(PROFILE_KEY, withAccount)
  }
}

/** Shallow-merge a partial update into the existing profile (PATCH). */
export function patchCareCompanionProfile(
  patch: Partial<CareCompanionProfile>,
): CareCompanionProfile {
  const current = getCareCompanionProfile()
  const seed = careCompanionProfileSeed as unknown as CareCompanionProfile
  const base = current ?? seed

  if (patch.costEstimates && base.costEstimates) {
    const existingMeds = base.costEstimates.medications ?? []
    const existingTests = base.costEstimates.tests ?? []
    const patchMeds = patch.costEstimates.medications ?? []
    const patchTests = patch.costEstimates.tests ?? []

    const isMerge = patchMeds.length < existingMeds.length
    if (isMerge) {
      const existingMedNames = new Set(
        existingMeds.map((m) => m.name.toLowerCase()),
      )
      const existingTestNames = new Set(
        existingTests.map((t) => t.name.toLowerCase()),
      )
      const newMeds = patchMeds.filter(
        (m) => !existingMedNames.has(m.name.toLowerCase()),
      )
      const newTests = patchTests.filter(
        (t) => !existingTestNames.has(t.name.toLowerCase()),
      )
      patch = {
        ...patch,
        costEstimates: {
          medications: [...existingMeds, ...newMeds],
          tests: [...existingTests, ...newTests],
        },
      }
    } else {
      const patchMedNames = new Set(
        patchMeds.map((m) => m.name.toLowerCase()),
      )
      const patchTestNames = new Set(
        patchTests.map((t) => t.name.toLowerCase()),
      )
      patch = {
        ...patch,
        costEstimates: {
          medications: patchMeds.map((m) => {
            const existing = existingMeds.find(
              (e) => e.name.toLowerCase() === m.name.toLowerCase(),
            )
            return existing ? { ...existing, ...m } : m
          }),
          tests: patchTests.map((t) => {
            const existing = existingTests.find(
              (e) => e.name.toLowerCase() === t.name.toLowerCase(),
            )
            return existing ? { ...existing, ...t } : t
          }),
        },
      }
    }
  }

  const merged = patchObject(PROFILE_KEY, base, patch)
  if (patch.treatment?.medicationNames?.length) {
    seedFromIntakeMedications(patch.treatment.medicationNames)
  }
  if (patch.costEstimates?.medications) {
    syncRefillFrequencies(patch.costEstimates.medications)
  }
  return merged
}

function syncRefillFrequencies(
  medications: { name: string; refillFrequencyDays?: number }[],
): void {
  const schedules = getRefillSchedules()
  let changed = false
  for (const med of medications) {
    if (med.refillFrequencyDays == null) continue
    const match = schedules.find(
      (s) => s.medicationName.toLowerCase() === med.name.toLowerCase(),
    )
    if (match && match.estimatedDaysSupply !== med.refillFrequencyDays) {
      match.estimatedDaysSupply = med.refillFrequencyDays
      changed = true
    }
  }
  if (changed) {
    writeCollection(REFILL_SCHEDULES_KEY, schedules)
  }
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
  const profile = getCareCompanionProfile()

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

  ensureTestSchedulesSeeded()
  const testSchedules = getTestSchedules()
  const sortedTests = [...testSchedules].sort(
    (a, b) => (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9),
  )

  return {
    refillSchedule: {
      schedules: sorted.slice(0, 3),
      hasMore: sorted.length > 3,
    },
    testSchedule: {
      schedules: sortedTests.slice(0, 3),
      hasMore: sortedTests.length > 3,
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

const CONDITION_LABELS: Record<string, string> = {
  DIABETES: "diabetes",
  HYPERTENSION: "blood pressure",
  ASTHMA: "asthma",
  CANCER: "cancer",
  KIDNEY_DISEASE: "kidney health",
  HEART_DISEASE: "heart health",
  SICKLE_CELL: "sickle cell",
  HIV_AIDS: "HIV",
  EPILEPSY: "epilepsy",
  COPD: "COPD",
  ARTHRITIS: "arthritis",
  MENTAL_HEALTH: "mental health",
  THYROID: "thyroid",
  STROKE: "stroke recovery",
  LIVER_DISEASE: "liver health",
  OTHER: "your condition",
}

/**
 * Generate profile-aware notifications from the user's intake data.
 * Called once when the intake profile is saved.
 */
function seedNotificationsFromIntake(profile: CareCompanionProfile): void {
  const now = Date.now()
  const notifications: CareCompanionNotification[] = []
  const meds = profile.treatment?.medicationNames ?? []
  const tests = profile.recurringTests?.selectedTests ?? []
  const conditions = profile.conditions?.type ?? []
  const conditionLabel = conditions.length > 0
    ? CONDITION_LABELS[conditions[0]] ?? "your condition"
    : "your health"

  // REFILL_REMINDER for the first medication (due in 3 days)
  if (meds.length > 0) {
    notifications.push({
      id: `notif-refill-reminder-${Date.now()}`,
      type: "REFILL_REMINDER",
      title: `${meds[0]} refill due soon`,
      body: `Your ${meds[0]} supply is expected to run out in 3 days. Refill now to stay on track.`,
      deepLink: "/patients/companion/refill-schedule",
      scheduledAt: new Date(now - 1 * DAY_MS).toISOString(),
      sentAt: new Date(now - 1 * DAY_MS).toISOString(),
      readAt: null,
      metadata: { medicationName: meds[0], daysUntilRefill: "3" },
    })
  }

  // REFILL_OVERDUE for the second medication (5 days overdue)
  if (meds.length > 1) {
    notifications.push({
      id: `notif-refill-overdue-${Date.now()}`,
      type: "REFILL_OVERDUE",
      title: `${meds[1]} refill overdue`,
      body: `Your ${meds[1]} refill is 5 days overdue. Missing doses can affect your ${conditionLabel} management.`,
      deepLink: "/patients/companion/refill-schedule",
      scheduledAt: new Date(now - 6 * DAY_MS).toISOString(),
      sentAt: new Date(now - 6 * DAY_MS).toISOString(),
      readAt: new Date(now - 5 * DAY_MS).toISOString(),
      metadata: { medicationName: meds[1], daysOverdue: "5" },
    })

    // REFILL_LOAN_OFFER for the overdue medication
    const costEst = profile.costEstimates?.medications?.find(
      (m) => m.name.toLowerCase() === meds[1].toLowerCase(),
    )
    const loanAmount = costEst?.estimatedCostPerRefill ?? 450
    notifications.push({
      id: `notif-refill-loan-${Date.now()}`,
      type: "REFILL_LOAN_OFFER",
      title: `Medication loan available for ${meds[1]}`,
      body: `Your ${meds[1]} is overdue. You are pre-approved for a KES ${loanAmount.toLocaleString()} medication loan to cover this refill.`,
      deepLink: "/patients/companion/medication-loan",
      scheduledAt: new Date(now - 5 * DAY_MS).toISOString(),
      sentAt: new Date(now - 5 * DAY_MS).toISOString(),
      readAt: null,
      metadata: { medicationName: meds[1], loanAmount: String(loanAmount), currency: "KES" },
    })
  }

  // PREDICTIVE_CREDIT_OFFER based on total medication costs
  if (meds.length > 0) {
    const totalCost = (profile.costEstimates?.medications ?? [])
      .reduce((sum, m) => sum + m.estimatedCostPerRefill, 0) || 1850
    notifications.push({
      id: `notif-predictive-credit-${Date.now()}`,
      type: "PREDICTIVE_CREDIT_OFFER",
      title: "Pre-approved credit for upcoming refills",
      body: `Based on your medication schedule, you may need KES ${totalCost.toLocaleString()} for refills this month. A medication loan is ready for you.`,
      deepLink: "/patients/companion/medication-loan",
      scheduledAt: new Date(now - 8 * DAY_MS).toISOString(),
      sentAt: new Date(now - 8 * DAY_MS).toISOString(),
      readAt: new Date(now - 7 * DAY_MS).toISOString(),
      metadata: { preApprovedAmount: String(totalCost), currency: "KES", medicationCount: String(meds.length) },
    })
  }

  // EDUCATION_WEEKLY relevant to the user's condition
  const educationTopics: Record<string, { title: string; body: string }> = {
    DIABETES: {
      title: "This week: Managing blood sugar with local foods",
      body: "Learn how everyday Kenyan foods like sukuma wiki and githeri can help keep your blood sugar stable.",
    },
    HYPERTENSION: {
      title: "This week: Reducing salt without losing flavour",
      body: "Tips for preparing tasty Kenyan meals while keeping your blood pressure in check.",
    },
    ASTHMA: {
      title: "This week: Managing asthma triggers at home",
      body: "Learn how to identify and reduce common asthma triggers in your home environment.",
    },
    CANCER: {
      title: "This week: Nutrition during treatment",
      body: "Practical food choices that can help you stay strong during your cancer treatment journey.",
    },
    KIDNEY_DISEASE: {
      title: "This week: Kidney-friendly meal planning",
      body: "Simple tips for managing potassium and sodium in your daily meals.",
    },
    HEART_DISEASE: {
      title: "This week: Heart-healthy living on a budget",
      body: "Affordable ways to keep your heart strong with local foods and daily movement.",
    },
    HIV_AIDS: {
      title: "This week: Staying strong on ARVs",
      body: "Nutrition and lifestyle tips to support your immune system alongside your medication.",
    },
    EPILEPSY: {
      title: "This week: Seizure safety at home",
      body: "Practical steps your family can take to keep you safe and supported.",
    },
    COPD: {
      title: "This week: Breathing exercises for COPD",
      body: "Simple daily techniques to improve your lung function and manage breathlessness.",
    },
    ARTHRITIS: {
      title: "This week: Joint-friendly movement",
      body: "Gentle exercises and stretches to keep your joints mobile and reduce stiffness.",
    },
    MENTAL_HEALTH: {
      title: "This week: Coping with stress",
      body: "Practical strategies for managing stress and building emotional resilience.",
    },
    THYROID: {
      title: "This week: Understanding your thyroid medication",
      body: "When to take it, what to avoid, and how to tell if your dose is right.",
    },
    STROKE: {
      title: "This week: Recovery milestones after stroke",
      body: "What to expect in your recovery journey and exercises that can help.",
    },
    LIVER_DISEASE: {
      title: "This week: Liver-friendly nutrition",
      body: "Foods that support liver health and what to avoid in your daily diet.",
    },
  }
  const eduTopic = conditions.length > 0
    ? educationTopics[conditions[0]] ?? { title: "This week: Living well with a chronic condition", body: "Practical tips for staying on top of your health every day." }
    : { title: "This week: Living well with a chronic condition", body: "Practical tips for staying on top of your health every day." }

  notifications.push({
    id: `notif-education-weekly-${Date.now()}`,
    type: "EDUCATION_WEEKLY",
    title: eduTopic.title,
    body: eduTopic.body,
    deepLink: "/patients/companion/education",
    scheduledAt: new Date(now - 1 * DAY_MS).toISOString(),
    sentAt: new Date(now - 1 * DAY_MS).toISOString(),
    readAt: null,
    metadata: { contentType: "EDUCATION", conditionType: conditions[0] ?? "GENERAL" },
  })

  // MEDICATION_CARD_AVAILABLE for a medication
  if (meds.length > 0) {
    const cardMed = meds[meds.length > 1 ? 1 : 0]
    notifications.push({
      id: `notif-medication-card-${Date.now()}`,
      type: "MEDICATION_CARD_AVAILABLE",
      title: `New medication card: ${cardMed}`,
      body: `A detailed guide for your ${cardMed} is now available. Learn about side effects, storage, and what to avoid.`,
      deepLink: "/patients/companion/medication-cards",
      scheduledAt: new Date(now - 4 * DAY_MS).toISOString(),
      sentAt: new Date(now - 4 * DAY_MS).toISOString(),
      readAt: new Date(now - 3 * DAY_MS).toISOString(),
      metadata: { medicationName: cardMed },
    })
  }

  // LAB_REMINDER for the first recurring test
  if (tests.length > 0) {
    notifications.push({
      id: `notif-lab-reminder-${Date.now()}`,
      type: "LAB_REMINDER",
      title: `${tests[0]} test due this month`,
      body: `Regular ${tests[0]} monitoring helps you and your doctor manage your ${conditionLabel} effectively.`,
      deepLink: "/patients/companion",
      scheduledAt: new Date(now - 2 * DAY_MS).toISOString(),
      sentAt: new Date(now - 2 * DAY_MS).toISOString(),
      readAt: null,
      metadata: { labTestName: tests[0], conditionType: conditions[0] ?? "GENERAL" },
    })
  }

  writeCollection(CC_NOTIFICATIONS_KEY, notifications)
}

/**
 * Returns all care companion notifications sorted by scheduledAt descending.
 * Optionally filters to unread-only (readAt === null).
 */
export function getCareCompanionNotifications(
  unreadOnly = false,
): CareCompanionNotification[] {
  const all = readCollection<CareCompanionNotification>(
    CC_NOTIFICATIONS_KEY,
    [] as CareCompanionNotification[],
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
    [] as CareCompanionNotification[],
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
    deepLink: "/patients/companion",
    scheduledAt: now,
    sentAt: now,
    readAt: null,
    metadata: null,
  }

  const all = readCollection<CareCompanionNotification>(
    CC_NOTIFICATIONS_KEY,
    [] as CareCompanionNotification[],
  )
  all.push(notification)
  writeCollection(CC_NOTIFICATIONS_KEY, all)

  return notification
}

/**
 * Add a fully-formed notification to the store. Used by the AI pipeline to
 * route LLM-generated insights into the notification feed.
 */
export function addCareCompanionNotification(
  notification: CareCompanionNotification,
): CareCompanionNotification {
  const all = readCollection<CareCompanionNotification>(
    CC_NOTIFICATIONS_KEY,
    [] as CareCompanionNotification[],
  )
  all.push(notification)
  writeCollection(CC_NOTIFICATIONS_KEY, all)
  return notification
}

// ---------------------------------------------------------------------------
// Schedule item updates
// ---------------------------------------------------------------------------

function computeStatus(daysUntil: number): import("@/types/care-companion").RefillStatus {
  if (daysUntil < 0) return "OVERDUE"
  if (daysUntil <= 14) return "DUE"
  return "UPCOMING"
}

function daysBetween(dateStr: string): number {
  const target = new Date(dateStr + "T00:00:00")
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
}

export function updateRefillScheduleItem(
  id: string,
  nextDate: string,
  frequencyDays: number,
): RefillSchedule | undefined {
  const schedules = getRefillSchedules()
  const index = schedules.findIndex((s) => s.id === id)
  if (index === -1) return undefined

  const days = daysBetween(nextDate)
  schedules[index] = {
    ...schedules[index],
    expectedRefillDate: nextDate,
    daysUntilRefill: days,
    status: computeStatus(days),
    estimatedDaysSupply: frequencyDays,
  }
  writeCollection(REFILL_SCHEDULES_KEY, schedules)
  return schedules[index]
}

const TEST_SCHEDULES_KEY = "care-companion-test-schedules"

export function getTestSchedules(): import("@/types/care-companion").TestScheduleItem[] {
  return readCollection<import("@/types/care-companion").TestScheduleItem>(
    TEST_SCHEDULES_KEY,
    [],
  )
}

export function ensureTestSchedulesSeeded(): void {
  const existing = getTestSchedules()
  if (existing.length > 0) return
  const profile = getCareCompanionProfile()
  if (!profile?.costEstimates?.tests) return
  const now = Date.now()
  const items: import("@/types/care-companion").TestScheduleItem[] = []
  for (const t of profile.costEstimates.tests) {
    const freqMs = t.frequencyMonths * 30 * 24 * 60 * 60 * 1000
    const nextDate = new Date(now + freqMs * 0.4)
    const daysUntil = Math.round(
      (nextDate.getTime() - now) / (24 * 60 * 60 * 1000),
    )
    items.push({
      id: `test-sched-${t.name.replace(/\s+/g, "-").toLowerCase()}`,
      testName: t.name,
      expectedDate: nextDate.toISOString().split("T")[0],
      status: computeStatus(daysUntil),
      daysUntilTest: daysUntil,
      frequencyMonths: t.frequencyMonths,
    })
  }
  writeCollection(TEST_SCHEDULES_KEY, items)
}

export function updateTestScheduleItem(
  testName: string,
  nextDate: string,
  frequencyMonths: number,
): import("@/types/care-companion").TestScheduleItem | undefined {
  ensureTestSchedulesSeeded()
  const schedules = getTestSchedules()
  const index = schedules.findIndex(
    (s) => s.testName.toLowerCase() === testName.toLowerCase(),
  )
  if (index === -1) return undefined

  const days = daysBetween(nextDate)
  schedules[index] = {
    ...schedules[index],
    expectedDate: nextDate,
    daysUntilTest: days,
    status: computeStatus(days),
    frequencyMonths,
  }
  writeCollection(TEST_SCHEDULES_KEY, schedules)
  return schedules[index]
}

// ---------------------------------------------------------------------------
// Events log
// ---------------------------------------------------------------------------

const EVENTS_LOG_KEY = "care-companion-events"

export function getEventsLog(): CareCompanionEvent[] {
  return readCollection<CareCompanionEvent>(EVENTS_LOG_KEY, [])
}

export function appendEvent(event: CareCompanionEvent): CareCompanionEvent {
  const all = getEventsLog()
  all.push(event)
  writeCollection(EVENTS_LOG_KEY, all)
  return event
}

export function updateEventById(
  id: string,
  patch: Partial<CareCompanionEvent>,
): CareCompanionEvent | null {
  const all = getEventsLog()
  const idx = all.findIndex((e) => e.id === id)
  if (idx === -1) return null
  const updated = { ...all[idx], ...patch } as CareCompanionEvent
  all[idx] = updated
  writeCollection(EVENTS_LOG_KEY, all)
  return updated
}

export function populatePaymentLineItems(
  paymentId: string,
  lineItems: PaymentEvent["lineItems"],
): CareCompanionEvent | null {
  const all = getEventsLog()
  const idx = all.findIndex((e) => e.id === paymentId && e.type === "PAYMENT")
  if (idx === -1) return null
  const payment = all[idx] as PaymentEvent
  all[idx] = { ...payment, lineItems }
  writeCollection(EVENTS_LOG_KEY, all)
  return all[idx]
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
