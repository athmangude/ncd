import { useEffect, useCallback } from "react"
import { Label } from "@/components/Label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { getMedicationPriceKES } from "@/mocks/fixtures/medication-prices"
import recurringTestsData from "@/mocks/fixtures/recurring-tests.json"
import type { CareCompanionProfile } from "@/types/care-companion"

type CostEstimatesData = CareCompanionProfile["costEstimates"]

interface RecurringTestEntry {
  testName: string
  defaultFrequencyMonths: number
  estimatedPriceKES: number
}

interface CostEstimationStepProps {
  medications: string[]
  tests: string[]
  data: CostEstimatesData
  onUpdate: (data: CostEstimatesData) => void
}

const testsTaxonomy = recurringTestsData as RecurringTestEntry[]

const REFILL_FREQUENCY_OPTIONS = [
  { value: "14", label: "Every 2 weeks" },
  { value: "30", label: "Monthly" },
  { value: "60", label: "Every 2 months" },
  { value: "90", label: "Every 3 months" },
]

const TEST_FREQUENCY_OPTIONS = [
  { value: "1", label: "Monthly" },
  { value: "3", label: "Every 3 months" },
  { value: "6", label: "Every 6 months" },
  { value: "12", label: "Yearly" },
]

function getEstimatedMedPrice(name: string): number {
  return getMedicationPriceKES(name)
}

function getTestInfo(
  name: string,
): { price: number; frequency: number } {
  const entry = testsTaxonomy.find(
    (t) => t.testName.toLowerCase() === name.toLowerCase(),
  )
  return {
    price: entry?.estimatedPriceKES ?? 1000,
    frequency: entry?.defaultFrequencyMonths ?? 6,
  }
}

export default function CostEstimationStep({
  medications,
  tests,
  data,
  onUpdate,
}: CostEstimationStepProps) {
  useEffect(() => {
    let changed = false
    let medEstimates = [...data.medications]
    let testEstimates = [...data.tests]

    const existingMedNames = new Set(
      data.medications.map((m) => m.name),
    )
    for (const name of medications) {
      if (!existingMedNames.has(name)) {
        changed = true
        medEstimates.push({
          name,
          refillFrequencyDays: 30,
          estimatedCostPerRefill: getEstimatedMedPrice(name),
        })
      }
    }
    medEstimates = medEstimates.filter((m) =>
      medications.includes(m.name),
    )
    if (medEstimates.length !== data.medications.length) changed = true

    const existingTestNames = new Set(
      data.tests.map((t) => t.name),
    )
    for (const name of tests) {
      if (!existingTestNames.has(name)) {
        changed = true
        const info = getTestInfo(name)
        testEstimates.push({
          name,
          frequencyMonths: info.frequency,
          estimatedCostPerTest: info.price,
        })
      }
    }
    testEstimates = testEstimates.filter((t) =>
      tests.includes(t.name),
    )
    if (testEstimates.length !== data.tests.length) changed = true

    if (changed) {
      onUpdate({
        medications: medEstimates,
        tests: testEstimates,
      })
    }
  }, [medications, tests])

  const updateMedFrequency = useCallback(
    (name: string, days: number) => {
      onUpdate({
        ...data,
        medications: data.medications.map((m) =>
          m.name === name
            ? { ...m, refillFrequencyDays: days }
            : m,
        ),
      })
    },
    [data, onUpdate],
  )

  const updateMedCost = useCallback(
    (name: string, cost: number) => {
      onUpdate({
        ...data,
        medications: data.medications.map((m) =>
          m.name === name
            ? { ...m, estimatedCostPerRefill: cost }
            : m,
        ),
      })
    },
    [data, onUpdate],
  )

  const updateTestFrequency = useCallback(
    (name: string, months: number) => {
      onUpdate({
        ...data,
        tests: data.tests.map((t) =>
          t.name === name ? { ...t, frequencyMonths: months } : t,
        ),
      })
    },
    [data, onUpdate],
  )

  const updateTestCost = useCallback(
    (name: string, cost: number) => {
      onUpdate({
        ...data,
        tests: data.tests.map((t) =>
          t.name === name
            ? { ...t, estimatedCostPerTest: cost }
            : t,
        ),
      })
    },
    [data, onUpdate],
  )

  const hasMedications = data.medications.length > 0
  const hasTests = data.tests.length > 0

  const monthlyMedCost = data.medications.reduce((sum, m) => {
    return sum + (m.estimatedCostPerRefill / m.refillFrequencyDays) * 30
  }, 0)

  const monthlyTestCost = data.tests.reduce((sum, t) => {
    return sum + t.estimatedCostPerTest / t.frequencyMonths
  }, 0)

  const totalMonthly = monthlyMedCost + monthlyTestCost

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2>Your estimated healthcare costs</h2>
        <p className="text-sm text-muted-foreground">
          Set how often you refill or take each test, and adjust the
          cost if the estimate doesn't match what you pay.
        </p>
      </div>

      {hasMedications && (
        <div className="flex flex-col gap-4">
          <h3>Medications</h3>
          {data.medications.map((med) => (
            <div
              key={med.name}
              className="flex flex-col gap-3 rounded-md border border-border p-4"
            >
              <p className="text-sm font-medium">{med.name}</p>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  How often do you refill?
                </Label>
                <Select
                  value={String(med.refillFrequencyDays)}
                  onValueChange={(v) =>
                    updateMedFrequency(med.name, Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REFILL_FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  Estimated cost per refill (KES)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    KES
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={med.estimatedCostPerRefill}
                    onChange={(e) =>
                      updateMedCost(
                        med.name,
                        Math.max(0, Number(e.target.value) || 0),
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-mono tabular-nums ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasTests && (
        <div className="flex flex-col gap-4">
          <h3>Recurring tests</h3>
          {data.tests.map((test) => (
            <div
              key={test.name}
              className="flex flex-col gap-3 rounded-md border border-border p-4"
            >
              <p className="text-sm font-medium">{test.name}</p>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  How often do you take this test?
                </Label>
                <Select
                  value={String(test.frequencyMonths)}
                  onValueChange={(v) =>
                    updateTestFrequency(test.name, Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_FREQUENCY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  Estimated cost per test (KES)
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    KES
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={test.estimatedCostPerTest}
                    onChange={(e) =>
                      updateTestCost(
                        test.name,
                        Math.max(0, Number(e.target.value) || 0),
                      )
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-mono tabular-nums ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(hasMedications || hasTests) && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Estimated monthly healthcare cost
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">
            KES {Math.round(totalMonthly).toLocaleString()}
          </p>
          <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
            {hasMedications && (
              <span>
                Medications: KES{" "}
                {Math.round(monthlyMedCost).toLocaleString()}/mo
              </span>
            )}
            {hasTests && (
              <span>
                Tests: KES{" "}
                {Math.round(monthlyTestCost).toLocaleString()}/mo
              </span>
            )}
          </div>
        </div>
      )}

      {!hasMedications && !hasTests && (
        <p className="text-sm text-muted-foreground">
          No medications or tests selected. Go back to add your
          medications or tests, or continue to the next step.
        </p>
      )}
    </div>
  )
}
