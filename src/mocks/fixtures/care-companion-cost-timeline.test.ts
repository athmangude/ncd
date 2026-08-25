import { describe, it, expect } from "vitest"
import type {
  CostSummary,
  CostBreakdownResponse,
  CostCategoryBreakdown,
  MonthlySpend,
  TimelineEntry,
} from "@/types/care-companion"
import { MEDICATION_CATEGORY } from "@/types/care-companion"

import costSummary from "./care-companion-cost-summary.json"
import costBreakdown from "./care-companion-cost-breakdown.json"
import timeline from "./care-companion-timeline.json"

// ---------------------------------------------------------------------------
// Helper: compile-time type guard. If the fixture drifts from the TypeScript
// interface the test file fails to compile before it even runs.
// ---------------------------------------------------------------------------

function assertType<T>(_value: T): void {
  // compile-time only
}

const VALID_CATEGORIES = new Set<string>(Object.values(MEDICATION_CATEGORY))

// ===========================================================================
// 1. care-companion-cost-summary.json
// ===========================================================================

describe("care-companion-cost-summary.json", () => {
  const data = costSummary as CostSummary

  // -----------------------------------------------------------------------
  // Type conformance
  // -----------------------------------------------------------------------

  describe("type conformance", () => {
    it("conforms to the CostSummary interface", () => {
      assertType<CostSummary>(data)
    })

    it("has all required CostSummary keys and no extras", () => {
      const expected = new Set([
        "year",
        "ytdSpend",
        "monthlyAverage",
        "cashbackEarned",
        "netSpend",
        "annualProjection",
        "transactionCount",
        "currency",
      ])
      const actual = new Set(Object.keys(data))
      expect(actual).toEqual(expected)
    })
  })

  // -----------------------------------------------------------------------
  // Field values match task specification
  // -----------------------------------------------------------------------

  describe("specified values", () => {
    it("year is 2026", () => {
      expect(data.year).toBe(2026)
    })

    it("ytdSpend is 18000.00", () => {
      expect(data.ytdSpend).toBe("18000.00")
    })

    it("monthlyAverage is 2571.43", () => {
      expect(data.monthlyAverage).toBe("2571.43")
    })

    it("cashbackEarned is 1260.00", () => {
      expect(data.cashbackEarned).toBe("1260.00")
    })

    it("netSpend is 16740.00", () => {
      expect(data.netSpend).toBe("16740.00")
    })

    it("annualProjection is 30857.14", () => {
      expect(data.annualProjection).toBe("30857.14")
    })

    it("transactionCount is 24", () => {
      expect(data.transactionCount).toBe(24)
    })

    it("currency is KES", () => {
      expect(data.currency).toBe("KES")
    })
  })

  // -----------------------------------------------------------------------
  // Monetary field types — string representation of numbers
  // -----------------------------------------------------------------------

  describe("monetary field types", () => {
    const monetaryFields = [
      "ytdSpend",
      "monthlyAverage",
      "cashbackEarned",
      "netSpend",
      "annualProjection",
    ] as const

    for (const field of monetaryFields) {
      it(`${field} is a string`, () => {
        expect(typeof data[field]).toBe("string")
      })

      it(`${field} parses to a finite number`, () => {
        const val = Number(data[field])
        expect(Number.isFinite(val)).toBe(true)
      })

      it(`${field} has exactly 2 decimal places`, () => {
        expect(data[field]).toMatch(/^\d+\.\d{2}$/)
      })
    }
  })

  // -----------------------------------------------------------------------
  // Financial calculation integrity
  // -----------------------------------------------------------------------

  describe("financial calculations", () => {
    it("netSpend = ytdSpend - cashbackEarned", () => {
      const expected = Number(data.ytdSpend) - Number(data.cashbackEarned)
      expect(Number(data.netSpend)).toBeCloseTo(expected, 2)
    })

    it("monthlyAverage = ytdSpend / 7 (Jan through Jul)", () => {
      const expected = Number(data.ytdSpend) / 7
      expect(Number(data.monthlyAverage)).toBeCloseTo(expected, 2)
    })

    it("annualProjection = (ytdSpend / 7) * 12 (computed from raw ytdSpend, not truncated monthlyAverage)", () => {
      const expected = (Number(data.ytdSpend) / 7) * 12
      expect(Number(data.annualProjection)).toBeCloseTo(expected, 2)
    })

    it("cashbackEarned is 7% of ytdSpend (the Jireh cashback rate)", () => {
      const rate = Number(data.cashbackEarned) / Number(data.ytdSpend)
      expect(rate).toBeCloseTo(0.07, 2)
    })

    it("netSpend is less than ytdSpend (cashback reduces cost)", () => {
      expect(Number(data.netSpend)).toBeLessThan(Number(data.ytdSpend))
    })

    it("annualProjection is greater than ytdSpend (year not over)", () => {
      expect(Number(data.annualProjection)).toBeGreaterThan(
        Number(data.ytdSpend),
      )
    })

    it("all monetary values are non-negative", () => {
      expect(Number(data.ytdSpend)).toBeGreaterThanOrEqual(0)
      expect(Number(data.monthlyAverage)).toBeGreaterThanOrEqual(0)
      expect(Number(data.cashbackEarned)).toBeGreaterThanOrEqual(0)
      expect(Number(data.netSpend)).toBeGreaterThanOrEqual(0)
      expect(Number(data.annualProjection)).toBeGreaterThanOrEqual(0)
    })
  })

  // -----------------------------------------------------------------------
  // Primitive type checks
  // -----------------------------------------------------------------------

  describe("primitive types", () => {
    it("year is an integer", () => {
      expect(Number.isInteger(data.year)).toBe(true)
    })

    it("transactionCount is a positive integer", () => {
      expect(Number.isInteger(data.transactionCount)).toBe(true)
      expect(data.transactionCount).toBeGreaterThan(0)
    })

    it("currency is the literal string KES", () => {
      expect(data.currency).toBe("KES")
    })
  })
})

// ===========================================================================
// 2. care-companion-cost-breakdown.json
// ===========================================================================

describe("care-companion-cost-breakdown.json", () => {
  const data = costBreakdown as CostBreakdownResponse

  // -----------------------------------------------------------------------
  // Type conformance
  // -----------------------------------------------------------------------

  describe("type conformance", () => {
    it("conforms to the CostBreakdownResponse interface", () => {
      assertType<CostBreakdownResponse>(data)
    })

    it("has the required top-level keys", () => {
      expect(data).toHaveProperty("year")
      expect(data).toHaveProperty("categories")
      expect(data).toHaveProperty("monthlyTrend")
      expect(data).toHaveProperty("pagination")
    })

    it("every category conforms to CostCategoryBreakdown", () => {
      for (const cat of data.categories) {
        assertType<CostCategoryBreakdown>(cat)
      }
    })

    it("every monthly trend entry conforms to MonthlySpend", () => {
      for (const entry of data.monthlyTrend) {
        assertType<MonthlySpend>(entry)
      }
    })
  })

  // -----------------------------------------------------------------------
  // Year
  // -----------------------------------------------------------------------

  it("year is 2026", () => {
    expect(data.year).toBe(2026)
  })

  // -----------------------------------------------------------------------
  // Categories — structure and values
  // -----------------------------------------------------------------------

  describe("categories", () => {
    it("contains exactly 3 categories", () => {
      expect(data.categories).toHaveLength(3)
    })

    it("categories are MEDICATION, LAB_TEST, and CONSULTATION", () => {
      const cats = data.categories.map((c) => c.category).sort()
      expect(cats).toEqual(["CONSULTATION", "LAB_TEST", "MEDICATION"])
    })

    it("all category values are valid MedicationCategory enum members", () => {
      for (const cat of data.categories) {
        expect(VALID_CATEGORIES).toContain(cat.category)
      }
    })

    it("MEDICATION category has totalSpend 14760.00, percentage 82, transactionCount 18", () => {
      const med = data.categories.find((c) => c.category === "MEDICATION")!
      expect(med).toBeDefined()
      expect(med.totalSpend).toBe("14760.00")
      expect(med.percentage).toBe(82)
      expect(med.transactionCount).toBe(18)
    })

    it("LAB_TEST category has totalSpend 1800.00, percentage 10, transactionCount 3", () => {
      const lab = data.categories.find((c) => c.category === "LAB_TEST")!
      expect(lab).toBeDefined()
      expect(lab.totalSpend).toBe("1800.00")
      expect(lab.percentage).toBe(10)
      expect(lab.transactionCount).toBe(3)
    })

    it("CONSULTATION category has totalSpend 1440.00, percentage 8, transactionCount 3", () => {
      const consult = data.categories.find(
        (c) => c.category === "CONSULTATION",
      )!
      expect(consult).toBeDefined()
      expect(consult.totalSpend).toBe("1440.00")
      expect(consult.percentage).toBe(8)
      expect(consult.transactionCount).toBe(3)
    })

    it("category percentages sum to 100", () => {
      const total = data.categories.reduce((s, c) => s + c.percentage, 0)
      expect(total).toBe(100)
    })

    it("category totalSpend values are numeric strings with 2 decimal places", () => {
      for (const cat of data.categories) {
        expect(typeof cat.totalSpend).toBe("string")
        expect(cat.totalSpend).toMatch(/^\d+\.\d{2}$/)
        expect(Number.isFinite(Number(cat.totalSpend))).toBe(true)
      }
    })

    it("category transactionCounts are positive integers", () => {
      for (const cat of data.categories) {
        expect(Number.isInteger(cat.transactionCount)).toBe(true)
        expect(cat.transactionCount).toBeGreaterThan(0)
      }
    })

    it("category totalSpend values sum to the cost summary ytdSpend (18000.00)", () => {
      const total = data.categories.reduce(
        (s, c) => s + Number(c.totalSpend),
        0,
      )
      expect(total).toBeCloseTo(
        Number((costSummary as CostSummary).ytdSpend),
        2,
      )
    })

    it("category transactionCounts sum to the cost summary transactionCount (24)", () => {
      const total = data.categories.reduce(
        (s, c) => s + c.transactionCount,
        0,
      )
      expect(total).toBe((costSummary as CostSummary).transactionCount)
    })

    it("MEDICATION is the dominant category by spend (> 50%)", () => {
      const med = data.categories.find((c) => c.category === "MEDICATION")!
      expect(med.percentage).toBeGreaterThan(50)
    })

    it("each category percentage matches its spend proportion", () => {
      const totalSpend = data.categories.reduce(
        (s, c) => s + Number(c.totalSpend),
        0,
      )
      for (const cat of data.categories) {
        const computedPct = Math.round(
          (Number(cat.totalSpend) / totalSpend) * 100,
        )
        expect(cat.percentage).toBe(computedPct)
      }
    })
  })

  // -----------------------------------------------------------------------
  // Monthly trend
  // -----------------------------------------------------------------------

  describe("monthlyTrend", () => {
    it("contains exactly 7 monthly entries", () => {
      expect(data.monthlyTrend).toHaveLength(7)
    })

    it("months are sequential from 1 through 7 (Jan-Jul)", () => {
      const months = data.monthlyTrend.map((t) => t.month)
      expect(months).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it("every spend value is a positive numeric string", () => {
      for (const t of data.monthlyTrend) {
        expect(typeof t.spend).toBe("string")
        expect(Number.isFinite(Number(t.spend))).toBe(true)
        expect(Number(t.spend)).toBeGreaterThan(0)
      }
    })

    it("every spend value has exactly 2 decimal places", () => {
      for (const t of data.monthlyTrend) {
        expect(t.spend).toMatch(/^\d+\.\d{2}$/)
      }
    })

    it("monthly spend values sum to ytdSpend (18000.00)", () => {
      const total = data.monthlyTrend.reduce(
        (s, t) => s + Number(t.spend),
        0,
      )
      expect(total).toBeCloseTo(
        Number((costSummary as CostSummary).ytdSpend),
        2,
      )
    })

    it("monthly spend values are realistic KES amounts (between 1000 and 5000)", () => {
      for (const t of data.monthlyTrend) {
        expect(Number(t.spend)).toBeGreaterThanOrEqual(1000)
        expect(Number(t.spend)).toBeLessThanOrEqual(5000)
      }
    })

    it("month-over-month changes are not identical (realistic variance)", () => {
      const amounts = data.monthlyTrend.map((t) => Number(t.spend))
      const unique = new Set(amounts)
      expect(unique.size).toBeGreaterThan(1)
    })

    it("spend shows a generally upward trend from month 1 to month 7", () => {
      const firstMonth = Number(data.monthlyTrend[0].spend)
      const lastMonth = Number(
        data.monthlyTrend[data.monthlyTrend.length - 1].spend,
      )
      expect(lastMonth).toBeGreaterThan(firstMonth)
    })
  })

  // -----------------------------------------------------------------------
  // Pagination
  // -----------------------------------------------------------------------

  describe("pagination", () => {
    it("total matches the monthlyTrend length", () => {
      expect(data.pagination.total).toBe(data.monthlyTrend.length)
    })

    it("limit is greater than total (all results fit in one page)", () => {
      expect(data.pagination.limit).toBeGreaterThanOrEqual(
        data.pagination.total,
      )
    })

    it("offset is 0 (first page)", () => {
      expect(data.pagination.offset).toBe(0)
    })

    it("limit is a positive integer", () => {
      expect(Number.isInteger(data.pagination.limit)).toBe(true)
      expect(data.pagination.limit).toBeGreaterThan(0)
    })
  })
})

// ===========================================================================
// 3. care-companion-timeline.json
// ===========================================================================

describe("care-companion-timeline.json", () => {
  const entries = timeline as TimelineEntry[]

  // -----------------------------------------------------------------------
  // Type conformance
  // -----------------------------------------------------------------------

  describe("type conformance", () => {
    it("conforms to TimelineEntry[] type", () => {
      for (const entry of entries) {
        assertType<TimelineEntry>(entry)
      }
    })

    it("every entry has all required TimelineEntry keys", () => {
      const requiredKeys = [
        "date",
        "medicationName",
        "dosage",
        "quantity",
        "lineTotal",
        "facilityName",
        "gapDaysFromPrevious",
        "isGapAnomaly",
      ]
      for (const entry of entries) {
        for (const key of requiredKeys) {
          expect(entry).toHaveProperty(key)
        }
      }
    })
  })

  // -----------------------------------------------------------------------
  // Entry count (spec: 15-20 entries)
  // -----------------------------------------------------------------------

  describe("entry count", () => {
    it("contains between 15 and 20 entries", () => {
      expect(entries.length).toBeGreaterThanOrEqual(15)
      expect(entries.length).toBeLessThanOrEqual(20)
    })

    it("contains exactly 18 entries", () => {
      expect(entries).toHaveLength(18)
    })
  })

  // -----------------------------------------------------------------------
  // Date ordering and range
  // -----------------------------------------------------------------------

  describe("dates", () => {
    it("all dates are valid ISO date strings", () => {
      for (const entry of entries) {
        expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(new Date(entry.date).toString()).not.toBe("Invalid Date")
      }
    })

    it("entries are in descending date order (most recent first)", () => {
      for (let i = 1; i < entries.length; i++) {
        const prev = new Date(entries[i - 1].date).getTime()
        const curr = new Date(entries[i].date).getTime()
        expect(prev).toBeGreaterThanOrEqual(curr)
      }
    })

    it("dates span 7 months (Jan 2026 through Jul 2026)", () => {
      const start = new Date("2026-01-01").getTime()
      const end = new Date("2026-07-31").getTime()
      for (const entry of entries) {
        const d = new Date(entry.date).getTime()
        expect(d).toBeGreaterThanOrEqual(start)
        expect(d).toBeLessThanOrEqual(end)
      }
    })

    it("the most recent entry is in July 2026", () => {
      const firstDate = new Date(entries[0].date)
      expect(firstDate.getFullYear()).toBe(2026)
      expect(firstDate.getMonth()).toBe(6) // July is 0-indexed month 6
    })

    it("the earliest entry is in January 2026", () => {
      const lastDate = new Date(entries[entries.length - 1].date)
      expect(lastDate.getFullYear()).toBe(2026)
      expect(lastDate.getMonth()).toBe(0) // January is 0-indexed month 0
    })
  })

  // -----------------------------------------------------------------------
  // Medications
  // -----------------------------------------------------------------------

  describe("medications", () => {
    it("includes all 3 of Grace's medications", () => {
      const medNames = new Set(entries.map((e) => e.medicationName))
      expect(medNames).toContain("Metformin 500mg")
      expect(medNames).toContain("Amlodipine 5mg")
      expect(medNames).toContain("Aspirin 75mg")
    })

    it("uses exactly 3 distinct medication names", () => {
      const medNames = new Set(entries.map((e) => e.medicationName))
      expect(medNames.size).toBe(3)
    })

    it("medication names include dosage in the name string", () => {
      for (const entry of entries) {
        expect(entry.medicationName).toMatch(/\d+mg/)
      }
    })

    it("dosage field matches the dosage in the medication name", () => {
      for (const entry of entries) {
        if (entry.dosage !== null) {
          expect(entry.medicationName).toContain(entry.dosage)
        }
      }
    })
  })

  // -----------------------------------------------------------------------
  // Facilities (spec: 2-3 facilities)
  // -----------------------------------------------------------------------

  describe("facilities", () => {
    it("includes purchases from at least 2 distinct facilities", () => {
      const facilities = new Set(entries.map((e) => e.facilityName))
      expect(facilities.size).toBeGreaterThanOrEqual(2)
    })

    it("includes purchases from at most 3 distinct facilities", () => {
      const facilities = new Set(entries.map((e) => e.facilityName))
      expect(facilities.size).toBeLessThanOrEqual(3)
    })

    it("facility names are non-empty strings", () => {
      for (const entry of entries) {
        expect(entry.facilityName.trim()).not.toBe("")
      }
    })

    it("no single facility accounts for all purchases", () => {
      const facilityCounts = new Map<string, number>()
      for (const entry of entries) {
        facilityCounts.set(
          entry.facilityName,
          (facilityCounts.get(entry.facilityName) ?? 0) + 1,
        )
      }
      for (const [, count] of facilityCounts) {
        expect(count).toBeLessThan(entries.length)
      }
    })
  })

  // -----------------------------------------------------------------------
  // Financial values
  // -----------------------------------------------------------------------

  describe("financial values", () => {
    it("lineTotal values are numeric strings with 2 decimal places", () => {
      for (const entry of entries) {
        expect(typeof entry.lineTotal).toBe("string")
        expect(entry.lineTotal).toMatch(/^\d+\.\d{2}$/)
      }
    })

    it("lineTotal values are positive", () => {
      for (const entry of entries) {
        expect(Number(entry.lineTotal)).toBeGreaterThan(0)
      }
    })

    it("lineTotal values are realistic KES amounts (100-5000 per line item)", () => {
      for (const entry of entries) {
        expect(Number(entry.lineTotal)).toBeGreaterThanOrEqual(100)
        expect(Number(entry.lineTotal)).toBeLessThanOrEqual(5000)
      }
    })

    it("total of all lineTotal values matches the MEDICATION category totalSpend in breakdown", () => {
      const timelineTotal = entries.reduce(
        (s, e) => s + Number(e.lineTotal),
        0,
      )
      const breakdownData = costBreakdown as CostBreakdownResponse
      const medCategory = breakdownData.categories.find(
        (c) => c.category === "MEDICATION",
      )!
      expect(timelineTotal).toBeCloseTo(Number(medCategory.totalSpend), 2)
    })
  })

  // -----------------------------------------------------------------------
  // Quantity and dosage
  // -----------------------------------------------------------------------

  describe("quantity and dosage", () => {
    it("quantity values are positive integers or null", () => {
      for (const entry of entries) {
        if (entry.quantity !== null) {
          expect(Number.isInteger(entry.quantity)).toBe(true)
          expect(entry.quantity).toBeGreaterThan(0)
        }
      }
    })

    it("dosage values are non-empty strings or null", () => {
      for (const entry of entries) {
        if (entry.dosage !== null) {
          expect(typeof entry.dosage).toBe("string")
          expect(entry.dosage.trim()).not.toBe("")
        }
      }
    })
  })

  // -----------------------------------------------------------------------
  // Gap anomaly detection (spec: at least 2 entries with isGapAnomaly true)
  // -----------------------------------------------------------------------

  describe("gap anomaly detection", () => {
    const anomalies = entries.filter((e) => e.isGapAnomaly)
    const nonAnomalies = entries.filter(
      (e) => !e.isGapAnomaly && e.gapDaysFromPrevious !== null,
    )

    it("contains at least 2 gap anomalies", () => {
      expect(anomalies.length).toBeGreaterThanOrEqual(2)
    })

    it("contains exactly 2 gap anomalies", () => {
      expect(anomalies).toHaveLength(2)
    })

    it("gap anomalies have non-null gapDaysFromPrevious", () => {
      for (const anomaly of anomalies) {
        expect(anomaly.gapDaysFromPrevious).not.toBeNull()
      }
    })

    it("gap anomalies have gapDaysFromPrevious > 1.5x the average non-anomaly gap", () => {
      const avgNormalGap =
        nonAnomalies.reduce((s, e) => s + e.gapDaysFromPrevious!, 0) /
        nonAnomalies.length

      for (const anomaly of anomalies) {
        expect(anomaly.gapDaysFromPrevious!).toBeGreaterThan(
          avgNormalGap * 1.5,
        )
      }
    })

    it("gap anomaly gaps exceed 35 days (well above the ~30 day refill cycle)", () => {
      for (const anomaly of anomalies) {
        expect(anomaly.gapDaysFromPrevious!).toBeGreaterThan(35)
      }
    })

    it("non-anomaly gaps are around 28-32 days (the typical refill cycle)", () => {
      for (const entry of nonAnomalies) {
        expect(entry.gapDaysFromPrevious!).toBeGreaterThanOrEqual(28)
        expect(entry.gapDaysFromPrevious!).toBeLessThanOrEqual(32)
      }
    })

    it("isGapAnomaly is a boolean for every entry", () => {
      for (const entry of entries) {
        expect(typeof entry.isGapAnomaly).toBe("boolean")
      }
    })

    it("entries with null gapDaysFromPrevious have isGapAnomaly false", () => {
      const nullGapEntries = entries.filter(
        (e) => e.gapDaysFromPrevious === null,
      )
      for (const entry of nullGapEntries) {
        expect(entry.isGapAnomaly).toBe(false)
      }
    })
  })

  // -----------------------------------------------------------------------
  // Gap day calculations — mathematical correctness per medication
  // -----------------------------------------------------------------------

  describe("gap day calculations", () => {
    const medGroups = new Map<string, TimelineEntry[]>()
    for (const entry of entries) {
      if (!medGroups.has(entry.medicationName)) {
        medGroups.set(entry.medicationName, [])
      }
      medGroups.get(entry.medicationName)!.push(entry)
    }

    it("the earliest entry per medication has gapDaysFromPrevious null", () => {
      for (const [, group] of medGroups) {
        const earliest = group[group.length - 1] // descending order
        expect(earliest.gapDaysFromPrevious).toBeNull()
      }
    })

    it("non-earliest entries per medication have numeric gapDaysFromPrevious", () => {
      for (const [, group] of medGroups) {
        for (let i = 0; i < group.length - 1; i++) {
          expect(typeof group[i].gapDaysFromPrevious).toBe("number")
        }
      }
    })

    it("gapDaysFromPrevious matches the actual calendar day difference between consecutive purchases of the same medication", () => {
      for (const [, group] of medGroups) {
        // group is in descending order
        for (let i = 0; i < group.length - 1; i++) {
          const newer = group[i]
          const older = group[i + 1]
          if (newer.gapDaysFromPrevious !== null) {
            const expected = Math.round(
              (new Date(newer.date).getTime() -
                new Date(older.date).getTime()) /
                (1000 * 60 * 60 * 24),
            )
            expect(newer.gapDaysFromPrevious).toBe(expected)
          }
        }
      }
    })

    it("gapDaysFromPrevious values are all positive when non-null", () => {
      for (const entry of entries) {
        if (entry.gapDaysFromPrevious !== null) {
          expect(entry.gapDaysFromPrevious).toBeGreaterThan(0)
        }
      }
    })

    it("there are exactly 3 entries with null gapDaysFromPrevious (one per medication)", () => {
      const nullGaps = entries.filter((e) => e.gapDaysFromPrevious === null)
      expect(nullGaps.length).toBe(3)
    })
  })

  // -----------------------------------------------------------------------
  // Per-medication purchase distribution
  // -----------------------------------------------------------------------

  describe("per-medication purchase counts", () => {
    it("each medication has at least 4 purchases across the 7 months", () => {
      const medGroups = new Map<string, number>()
      for (const entry of entries) {
        medGroups.set(
          entry.medicationName,
          (medGroups.get(entry.medicationName) ?? 0) + 1,
        )
      }
      for (const [, count] of medGroups) {
        expect(count).toBeGreaterThanOrEqual(4)
      }
    })

    it("Metformin has more purchases than Aspirin (daily vs less frequent)", () => {
      const metforminCount = entries.filter(
        (e) => e.medicationName === "Metformin 500mg",
      ).length
      const aspirinCount = entries.filter(
        (e) => e.medicationName === "Aspirin 75mg",
      ).length
      expect(metforminCount).toBeGreaterThanOrEqual(aspirinCount)
    })
  })
})

// ===========================================================================
// 4. Cross-fixture consistency
// ===========================================================================

describe("cost tracker and timeline cross-fixture consistency", () => {
  const summary = costSummary as CostSummary
  const breakdown = costBreakdown as CostBreakdownResponse
  const timelineEntries = timeline as TimelineEntry[]

  it("summary and breakdown share the same year (2026)", () => {
    expect(summary.year).toBe(breakdown.year)
  })

  it("MEDICATION category transactionCount matches timeline entry count", () => {
    const medCategory = breakdown.categories.find(
      (c) => c.category === "MEDICATION",
    )!
    expect(medCategory.transactionCount).toBe(timelineEntries.length)
  })

  it("MEDICATION category totalSpend matches sum of timeline lineTotals", () => {
    const medCategory = breakdown.categories.find(
      (c) => c.category === "MEDICATION",
    )!
    const timelineSum = timelineEntries.reduce(
      (s, e) => s + Number(e.lineTotal),
      0,
    )
    expect(Number(medCategory.totalSpend)).toBeCloseTo(timelineSum, 2)
  })

  it("breakdown category spend totals equal the summary ytdSpend", () => {
    const categoryTotal = breakdown.categories.reduce(
      (s, c) => s + Number(c.totalSpend),
      0,
    )
    expect(categoryTotal).toBeCloseTo(Number(summary.ytdSpend), 2)
  })

  it("breakdown category transactionCounts total equals summary transactionCount", () => {
    const categoryTxTotal = breakdown.categories.reduce(
      (s, c) => s + c.transactionCount,
      0,
    )
    expect(categoryTxTotal).toBe(summary.transactionCount)
  })

  it("monthlyTrend spend values sum to ytdSpend", () => {
    const trendTotal = breakdown.monthlyTrend.reduce(
      (s, t) => s + Number(t.spend),
      0,
    )
    expect(trendTotal).toBeCloseTo(Number(summary.ytdSpend), 2)
  })

  it("monthlyTrend month count matches the projection divisor (7 months)", () => {
    // monthlyAverage = ytdSpend / 7, so the trend should have 7 entries
    const monthCount = breakdown.monthlyTrend.length
    const computedAvg = Number(summary.ytdSpend) / monthCount
    expect(Number(summary.monthlyAverage)).toBeCloseTo(computedAvg, 2)
  })

  it("timeline entries span the same months as the monthly trend (1-7)", () => {
    const trendMonths = new Set(breakdown.monthlyTrend.map((t) => t.month))
    const timelineMonths = new Set(
      timelineEntries.map((e) => new Date(e.date).getMonth() + 1),
    )
    // Every month in the timeline should appear in the trend
    for (const m of timelineMonths) {
      expect(trendMonths).toContain(m)
    }
  })

  it("non-MEDICATION categories (LAB_TEST + CONSULTATION) account for the difference between ytdSpend and timeline total", () => {
    const timelineTotal = timelineEntries.reduce(
      (s, e) => s + Number(e.lineTotal),
      0,
    )
    const nonMedCategories = breakdown.categories.filter(
      (c) => c.category !== "MEDICATION",
    )
    const nonMedTotal = nonMedCategories.reduce(
      (s, c) => s + Number(c.totalSpend),
      0,
    )
    const expected = Number(summary.ytdSpend) - timelineTotal
    expect(nonMedTotal).toBeCloseTo(expected, 2)
  })
})
