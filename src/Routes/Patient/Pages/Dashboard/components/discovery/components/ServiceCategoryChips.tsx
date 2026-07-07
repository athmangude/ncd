import { useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/Skeleton"
import { ServiceCategory } from "../api/useServiceCategories"

const INITIAL_VISIBLE = 12

interface ServiceCategoryChipsProps {
  categories: ServiceCategory[]
  selected: string[]
  onToggle: (category: string) => void
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function ServiceCategoryChips({
  categories,
  selected,
  onToggle,
  isLoading,
  isError,
  onRetry,
}: ServiceCategoryChipsProps) {
  const [showAll, setShowAll] = useState(false)

  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-20 bg-muted rounded" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          Couldn&apos;t load services.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-medium text-primary self-start"
        >
          Try again
        </button>
      </div>
    )
  }

  const visible = showAll ? categories : categories.slice(0, INITIAL_VISIBLE)
  const hasMore = categories.length > INITIAL_VISIBLE

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((c) => {
        const isSelected = selected.includes(c.category)
        return (
          <button
            key={c.category}
            type="button"
            onClick={() => onToggle(c.category)}
            className={cn(
              "h-8 px-3 rounded-md text-sm transition-colors",
              isSelected
                ? "bg-teal-50 text-teal-800 border border-teal-300"
                : "bg-muted text-foreground border border-border"
            )}
          >
            {c.displayName}
          </button>
        )
      })}
      {hasMore && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="h-8 px-1 text-sm font-medium text-primary"
        >
          Show all
        </button>
      )}
    </div>
  )
}
