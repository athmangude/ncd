import { PersonStanding } from "lucide-react"
import { cn } from "@/lib/utils"

interface RatingPeopleBarProps {
  score: number
}

export function RatingPeopleBar({ score }: RatingPeopleBarProps) {
  const filled = Math.max(0, Math.min(10, Math.round(score)))

  return (
    <div
      className="flex items-end justify-center gap-1"
      role="img"
      aria-label={`Rating ${score.toFixed(1)} out of 10`}
    >
      {Array.from({ length: 10 }).map((_, i) => (
        <PersonStanding
          key={i}
          className={cn(
            "h-7 w-7",
            i < filled ? "text-teal-500" : "text-neutral-300"
          )}
        />
      ))}
    </div>
  )
}
