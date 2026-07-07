import { useState } from "react"
import { Skeleton } from "@/components/Skeleton"
import { Chip } from "@/components/Chip"
import { Button } from "@/components/Button"
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
        <Button
          variant="link"
          size="sm"
          onClick={onRetry}
          className="self-start"
        >
          Try again
        </Button>
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
          <Chip
            key={c.category}
            variant={isSelected ? "secondary" : "outline"}
            aria-pressed={isSelected}
            onClick={() => onToggle(c.category)}
          >
            {c.displayName}
          </Chip>
        )
      })}
      {hasMore && !showAll && (
        <Button variant="link" size="sm" onClick={() => setShowAll(true)}>
          Show all
        </Button>
      )}
    </div>
  )
}
