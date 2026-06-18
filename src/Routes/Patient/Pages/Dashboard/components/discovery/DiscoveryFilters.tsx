import { useState, useEffect, KeyboardEvent } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/Input"
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
      <button
        type="button"
        onClick={handleSearch}
        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-neutral-200 rounded-full transition-colors z-10"
      >
        <Search className="h-4 w-4 text-neutral-400" />
      </button>
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
          <span className="text-xs text-neutral-500 mb-1 block ml-1">Filters</span>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-9 rounded-lg border-neutral-200 bg-white">
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
          <span className="text-xs text-neutral-500 mb-1 block ml-1 opacity-0 hidden sm:block">.</span>
          <Select value={filterLevel} onValueChange={setFilterLevel}>
            <SelectTrigger className="h-9 rounded-lg border-neutral-200 bg-white">
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
      <div className="flex bg-purple-50 rounded-xl">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "all" 
            ? "bg-purple-600 text-white shadow-sm" 
            : "text-purple-600 hover:bg-purple-100"
          }`}
        >
          All <span className="ml-1 opacity-80 text-xs bg-white/20 rounded-full">{facilitiesCount}</span>
        </button>
        <button
          onClick={() => setActiveTab("jireh")}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
            activeTab === "jireh" 
            ? "bg-purple-600 text-white shadow-sm" 
            : "text-purple-600 hover:bg-purple-100"
          }`}
        >
          Jireh Accepted <span className="ml-1 opacity-80 text-xs bg-purple-200 text-purple-700 rounded-full">{jirehAcceptedCount}</span>
        </button>
      </div>
    </div>
  )
}
