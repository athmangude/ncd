import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"
import { CheckCircle2 } from "lucide-react"
import type { CareCompanionProfile } from "@/types/care-companion"

interface IntakeCompletionStepProps {
  profile: CareCompanionProfile
  onComplete: () => void
}

const CONDITION_LABELS: Record<string, string> = {
  DIABETES: "diabetes",
  HYPERTENSION: "hypertension",
  ASTHMA: "asthma",
  CANCER: "cancer",
  KIDNEY_DISEASE: "kidney disease",
  HEART_DISEASE: "heart disease",
  SICKLE_CELL: "sickle cell disease",
}

const GOAL_BULLET_MAP: Record<string, string> = {
  TRACK_COSTS: "Tracking your healthcare spending",
  MEDICATION_REMINDERS: "Reminding you when to refill your medication",
  UNDERSTAND_MEDICATION:
    "Helping you understand your medications and side effects",
  FIND_AFFORDABLE_PHARMACY:
    "Finding affordable pharmacies with your medication in stock",
  EMERGENCY_HELP: "Helping you prepare for health emergencies",
  DIET_TIPS: "Providing diet tips that work for your whole family",
  EXERCISE_GUIDANCE: "Guiding you on safe exercise for your condition",
  EMOTIONAL_SUPPORT: "Supporting you emotionally on your health journey",
  CREDIT_FOR_MEDICATION:
    "Helping you access credit when you need medication",
  SHARE_WITH_FAMILY: "Helping you share health costs with family",
}

const CHALLENGE_BULLET_MAP: Record<string, string> = {
  COST: "Tracking your {conditions} medication costs",
  UNDERSTANDING_MEDICATION:
    "Helping you understand your {conditions} medications",
  DIET: "Providing dietary guidance for {conditions}",
  EXERCISE: "Guiding safe physical activity for {conditions}",
  SIDE_EFFECTS: "Managing medication side effects for {conditions}",
  FINDING_PHARMACY: "Finding pharmacies that stock your medication",
  EMOTIONAL: "Supporting your emotional wellbeing",
  FAMILY_SUPPORT: "Connecting your care with family support",
  EMERGENCY_PREPAREDNESS: "Preparing you for health emergencies",
  NAVIGATING_SYSTEM: "Navigating the healthcare system with confidence",
  STIGMA: "Supporting your journey toward acceptance",
}

function formatConditions(
  types: CareCompanionProfile["conditions"]["type"]
): string {
  const names = types
    .filter((t) => t !== "OTHER")
    .map((t) => CONDITION_LABELS[t] ?? t.toLowerCase())

  if (names.length === 0) return "your condition"
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`
}

function derivePersonalisedBullets(
  profile: CareCompanionProfile
): [string, string, string] {
  const conditionText = formatConditions(profile.conditions.type)
  const bullets: string[] = []
  const usedGoals = new Set<string>()

  // Bullet 1: derived from top challenge + conditions
  if (profile.challenges.topChallenge) {
    const template =
      CHALLENGE_BULLET_MAP[profile.challenges.topChallenge]
    if (template) {
      bullets.push(template.replace("{conditions}", conditionText))
    }
  }

  // Bullet 2: derived from first medication name + a goal
  if (
    profile.treatment.currentlyOnMedication &&
    profile.treatment.medicationNames.length > 0
  ) {
    const firstMed = profile.treatment.medicationNames[0]
    if (profile.goals.selected.includes("MEDICATION_REMINDERS")) {
      bullets.push(`Alerting you when it is time to refill ${firstMed}`)
      usedGoals.add("MEDICATION_REMINDERS")
    } else if (profile.goals.selected.includes("UNDERSTAND_MEDICATION")) {
      bullets.push(`Helping you understand how ${firstMed} works`)
      usedGoals.add("UNDERSTAND_MEDICATION")
    }
  }

  // Bullet 3 (and fill remaining): derived from goals not yet represented
  for (const goal of profile.goals.selected) {
    if (bullets.length >= 3) break
    if (usedGoals.has(goal)) continue

    const challengeKey = profile.challenges.topChallenge
    if (
      goal === "TRACK_COSTS" &&
      challengeKey === "COST" &&
      bullets.length > 0
    ) {
      continue
    }

    const bullet = GOAL_BULLET_MAP[goal]
    if (bullet && !bullets.some((b) => b === bullet)) {
      bullets.push(bullet)
      usedGoals.add(goal)
    }
  }

  // Ensure exactly 3 bullets with fallbacks
  const fallbacks = [
    `Managing your ${conditionText} care`,
    "Supporting your health journey with personalised guidance",
    "Connecting you to affordable healthcare resources",
  ]

  while (bullets.length < 3) {
    const fallback = fallbacks[bullets.length]
    if (fallback && !bullets.includes(fallback)) {
      bullets.push(fallback)
    } else {
      bullets.push("Supporting your health journey")
    }
  }

  return [bullets[0], bullets[1], bullets[2]]
}

export default function IntakeCompletionStep({
  profile,
  onComplete,
}: IntakeCompletionStepProps) {
  const navigate = useNavigate()
  const bullets = derivePersonalisedBullets(profile)

  function handleGetStarted() {
    onComplete()
    navigate("/patients/care-companion")
  }

  return (
    <div className="flex flex-col items-center gap-8 px-2 py-6">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          "bg-accent"
        )}
      >
        <CheckCircle2 className="h-8 w-8 text-primary" />
      </div>

      <div className="flex flex-col gap-2 text-center">
        <h2 >
          Your Care Companion is ready
        </h2>
        <p className="text-sm text-muted-foreground">
          Based on your answers, here is what your Care Companion will
          focus on:
        </p>
      </div>

      <ul className="flex w-full flex-col gap-4" aria-label="Focus areas">
        {bullets.map((bullet, index) => (
          <li
            key={index}
            className={cn(
              "flex items-start gap-3 rounded-md border border-border bg-background p-4"
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                "bg-secondary text-primary font-mono text-xs font-semibold"
              )}
            >
              {index + 1}
            </span>
            <span className="text-sm font-sans leading-relaxed">
              {bullet}
            </span>
          </li>
        ))}
      </ul>

      <Button
        size="lg"
        className="w-full"
        onClick={handleGetStarted}
      >
        Get started
      </Button>
    </div>
  )
}
