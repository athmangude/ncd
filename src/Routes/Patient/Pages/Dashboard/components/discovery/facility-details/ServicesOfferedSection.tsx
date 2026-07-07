import { useState, useMemo } from "react"
import {
  ChevronRight,
  List,
  ChevronsUpDown,
  ChevronsDownUp,
} from "lucide-react"
import { FacilityServiceListItem } from "../types"
import {
  serviceCategoryLabel,
  compareCategorySlugs,
} from "./serviceCategoryLabels"
import { SectionTitle } from "@/components/SectionTitle"

interface ServicesOfferedSectionProps {
  services?: FacilityServiceListItem[]
}

interface CategoryGroup {
  slug: string
  label: string
  items: FacilityServiceListItem[]
}

export function ServicesOfferedSection({
  services,
}: ServicesOfferedSectionProps) {
  const groups = useMemo<CategoryGroup[]>(() => {
    if (!services || services.length === 0) return []
    const bySlug = new Map<string, FacilityServiceListItem[]>()
    for (const s of services) {
      const list = bySlug.get(s.category) ?? []
      list.push(s)
      bySlug.set(s.category, list)
    }
    return Array.from(bySlug.entries())
      .map(([slug, items]) => ({
        slug,
        label: serviceCategoryLabel(slug),
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .sort((a, b) => compareCategorySlugs(a.slug, b.slug))
  }, [services])

  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  if (groups.length === 0) return null

  const toggle = (slug: string) =>
    setExpanded((prev) => ({ ...prev, [slug]: !prev[slug] }))

  const expandAll = () => {
    setExpanded(Object.fromEntries(groups.map((g) => [g.slug, true])))
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-2 py-1.5 w-full">
        <List className="h-4 w-4 text-muted-foreground" />
        <SectionTitle className="flex-1">Services offered</SectionTitle>
        <button
          type="button"
          onClick={expandAll}
          className="flex items-center gap-0.5 text-sm text-foreground font-medium"
        >
          See all
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col rounded-xl border border-border bg-white overflow-hidden">
        {groups.map((g, idx) => {
          const isOpen = !!expanded[g.slug]
          return (
            <div
              key={g.slug}
              className={idx > 0 ? "border-t border-border" : ""}
            >
              <button
                type="button"
                onClick={() => toggle(g.slug)}
                className="flex items-center w-full px-4 py-3 text-left"
                aria-expanded={isOpen}
              >
                <span className="w-5 text-sm text-foreground tabular-nums mr-3">
                  {idx + 1}
                </span>
                <span className="flex-1 text-sm text-foreground">
                  {g.label}
                </span>
                {isOpen ? (
                  <ChevronsDownUp className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                ) : (
                  <ChevronsUpDown className="h-4 w-4 text-muted-foreground transition-transform duration-200" />
                )}
              </button>
              <div
                className={`grid transition-all duration-200 ease-out ${
                  isOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <ul className="pl-12 pr-4 pb-3 flex flex-col gap-1">
                    {g.items.map((item) => (
                      <li
                        key={item.id}
                        className="text-sm text-muted-foreground"
                      >
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
