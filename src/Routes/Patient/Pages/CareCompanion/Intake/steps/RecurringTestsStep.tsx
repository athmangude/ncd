import { useState, useMemo, useCallback } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/Button"
import { Chip } from "@/components/Chip"
import IntakeOption from "../components/IntakeOption"
import {
  useRecurringTests,
  type RecurringTestEntry,
} from "@/hooks/useRecurringTests"
import type { CareCompanionProfile } from "@/types/care-companion"

type RecurringTestsData = CareCompanionProfile["recurringTests"]
type ConditionValue = CareCompanionProfile["conditions"]["type"][number]

interface RecurringTestsStepProps {
  data: RecurringTestsData
  conditions: ConditionValue[]
  onUpdate: (data: RecurringTestsData) => void
}

const CONDITION_LABELS: Record<string, string> = {
  DIABETES: "Diabetes",
  HYPERTENSION: "High Blood Pressure",
  ASTHMA: "Asthma",
  CANCER: "Cancer",
  KIDNEY_DISEASE: "Kidney Disease",
  HEART_DISEASE: "Heart Disease",
  SICKLE_CELL: "Sickle Cell Disease",
  HIV_AIDS: "HIV/AIDS",
  EPILEPSY: "Epilepsy",
  COPD: "Chronic Lung Disease (COPD)",
  ARTHRITIS: "Arthritis",
  MENTAL_HEALTH: "Mental Health",
  THYROID: "Thyroid Disorder",
  STROKE: "Stroke",
  LIVER_DISEASE: "Liver Disease",
}

function formatFrequency(months: number): string {
  if (months === 1) return "Recommended monthly"
  if (months === 3) return "Recommended every 3 months"
  if (months === 6) return "Recommended every 6 months"
  if (months === 12) return "Recommended yearly"
  return `Recommended every ${months} months`
}

export default function RecurringTestsStep({
  data,
  conditions,
  onUpdate,
}: RecurringTestsStepProps) {
  const { data: tests = [] } = useRecurringTests()
  const [showOtherInput, setShowOtherInput] = useState(false)
  const [customTestName, setCustomTestName] = useState("")

  const allTestNames = useMemo(
    () => new Set(tests.map((t) => t.testName)),
    [tests],
  )

  const customTests = useMemo(
    () => data.selectedTests.filter((n) => !allTestNames.has(n)),
    [data.selectedTests, allTestNames],
  )

  const testsByCondition = useMemo(() => {
    const assigned = new Set<string>()
    const groups: {
      condition: string
      tests: RecurringTestEntry[]
    }[] = []

    for (const condition of conditions) {
      if (condition === "OTHER") continue
      const matched = tests.filter(
        (t) =>
          !assigned.has(t.id) && t.conditionTags.includes(condition),
      )
      if (matched.length > 0) {
        matched.forEach((t) => assigned.add(t.id))
        groups.push({
          condition,
          tests: matched.sort((a, b) =>
            a.testName.localeCompare(b.testName),
          ),
        })
      }
    }

    return groups
  }, [conditions, tests])

  const toggleTest = useCallback(
    (testName: string) => {
      const current = data.selectedTests
      const updated = current.includes(testName)
        ? current.filter((n) => n !== testName)
        : [...current, testName]
      onUpdate({ selectedTests: updated })
    },
    [data, onUpdate],
  )

  function addCustomTest() {
    const trimmed = customTestName.trim()
    if (!trimmed || data.selectedTests.includes(trimmed)) return
    onUpdate({ selectedTests: [...data.selectedTests, trimmed] })
    setCustomTestName("")
  }

  function removeCustomTest(name: string) {
    onUpdate({
      selectedTests: data.selectedTests.filter((n) => n !== name),
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2>Your recurring medical tests</h2>
        <p className="text-sm text-muted-foreground">
          Which tests do you regularly take for your condition? This
          helps us estimate your healthcare costs and send you
          reminders.
        </p>
      </div>

      {testsByCondition.map(({ condition, tests: conditionTests }) => (
        <div key={condition} className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {CONDITION_LABELS[condition] ?? condition}
          </p>
          <div className="flex flex-col gap-2">
            {conditionTests.map((test) => (
              <IntakeOption
                key={test.id}
                label={test.testName}
                description={`${test.description} · ${formatFrequency(test.defaultFrequencyMonths)}`}
                selected={data.selectedTests.includes(test.testName)}
                onToggle={() => toggleTest(test.testName)}
                mode="checkbox"
              />
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <IntakeOption
          label="Other"
          description="Add a test not listed above"
          selected={showOtherInput || customTests.length > 0}
          onToggle={() => setShowOtherInput((v) => !v)}
          mode="checkbox"
        />

        {(showOtherInput || customTests.length > 0) && (
          <div className="ml-2 flex flex-col gap-3 border-l-2 border-muted pl-4">
            {customTests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {customTests.map((name) => (
                  <Chip
                    key={name}
                    onRemove={() => removeCustomTest(name)}
                    removeLabel={`Remove ${name}`}
                  >
                    {name}
                  </Chip>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customTestName}
                onChange={(e) => setCustomTestName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomTest()
                  }
                }}
                placeholder="Type test name..."
                className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sensitive-data"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addCustomTest}
                disabled={!customTestName.trim()}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      {testsByCondition.length === 0 && customTests.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No standard recurring tests found for your conditions. Use
          the &quot;Other&quot; option above to add your tests, or skip
          this step.
        </p>
      )}
    </div>
  )
}
