import { useState, useEffect, KeyboardEvent } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/Input"
import { Button } from "@/components/Button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ToggleGroup"
import { Badge } from "@/components/Badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select"
import { FACILITY_TYPES, FACILITY_LEVELS } from "./constants"

const SEARCH_DEBOUNCE_MS = 300

export function DiscoverySearchBar({
  searchQuery,
  setSearchQuery,
  placeholder = "Find care near me",
  className = "",
  debounceMs = SEARCH_DEBOUNCE_MS,
  onFocus,
}: {
  searchQuery: string
  setSearchQuery: (val: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
  onFocus?: () => void
}) {
  const [localSearch, setLocalSearch] = useState(searchQuery)
  useEffect(() => {
    setLocalSearch(searchQuery)
  }, [searchQuery])
  // Update search as user types (debounced)
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(localSearch), debounceMs)
    return () => clearTimeout(t)
  }, [localSearch, debounceMs, setSearchQuery])
  const handleSearch = () => setSearchQuery(localSearch)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch()
  }
  return (
    <div className={`relative ${className}`}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={handleSearch}
        aria-label="Search"
        className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10"
      >
        <Search className="h-4 w-4 text-muted-foreground" />
      </Button>
      <Input
        placeholder={placeholder}
        className="pl-9 bg-transparent border-0 rounded-full h-11 shadow-none focus-visible:ring-0"
        value={localSearch}
        onChange={(e) => setLocalSearch(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onFocus}
      />
    </div>
  )
}

interface DiscoveryFiltersProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  filterType: string
  setFilterType: (val: string) => void
  filterLevel: string
  setFilterLevel: (val: string) => void
  activeTab: "all" | "jireh"
  setActiveTab: (val: "all" | "jireh") => void
  facilitiesCount: number
  jirehAcceptedCount: number
  /** When true, search is rendered elsewhere (e.g. inside map). Default false. */
  hideSearch?: boolean
}

export function DiscoveryFilters({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterLevel,
  setFilterLevel,
  activeTab,
  setActiveTab,
  facilitiesCount,
  jirehAcceptedCount,
  hideSearch = false,
}: DiscoveryFiltersProps) {
  return (
    <div className="px-4 space-y-4 pb-2">
      {!hideSearch && (
        <DiscoverySearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      )}

      {/* Filters Row */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="w-full sm:w-1/2">
          <span className="text-xs text-muted-foreground mb-1 block ml-1">
            Filters
          </span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 rounded-lg border-border bg-card">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="max-h-[min(70vh,400px)]">
              <SelectItem value="All">Type: All</SelectItem>
              {FACILITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-1/2">
          <span className="text-xs text-muted-foreground mb-1 block ml-1 opacity-0 hidden sm:block">
            .
          </span>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="h-9 rounded-lg border-border bg-card">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">Level: All</SelectItem>
              {FACILITY_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Toggle Tabs */}
      <ToggleGroup
        type="single"
        value={activeTab}
        onValueChange={(val) => {
          if (val) setActiveTab(val as "all" | "jireh")
        }}
      >
        <ToggleGroupItem value="all">
          All
          <Badge variant="neutral">{facilitiesCount}</Badge>
        </ToggleGroupItem>
        <ToggleGroupItem value="jireh">
          Jireh Accepted
          <Badge variant="neutral">{jirehAcceptedCount}</Badge>
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
