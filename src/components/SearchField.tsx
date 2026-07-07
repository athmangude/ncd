import type React from "react"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Input } from "@/components/Input"
import { Card } from "@/components/Card"
import { Skeleton } from "@/components/Skeleton"
import { Alert, AlertDescription } from "@/components/Alert"
import { Search, X, AlertCircle, Sparkles, Plus, Check } from "lucide-react"
import { Button } from "./Button"
import { highlightSearchTerm } from "@/utilities/textUtilities"

// Types
interface SearchResult {
  id: string
  title: string
  description: string
  category: string
  url?: string
  [key: string]: any // Add index signature for dynamic property access
}

interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  [key: string]: any // Add index signature for dynamic property access
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// API function
const searchAPI = async (
  searchUrl: string,
  query: string
): Promise<SearchResponse> => {
  if (!query.trim()) {
    return { results: [], total: 0, query }
  }

  const response = await axios.get(
    import.meta.env.VITE_API_BASE_URL + searchUrl,
    {
      params: { searchTerm: query },
      timeout: 5000, // 5 second timeout
    }
  )

  return response.data
}

interface SearchFieldProps {
  placeholder?: string
  debounceMs?: number
  minQueryLength?: number
  onResultSelect?: (result: SearchResult) => void
  className?: string
  searchUrl: string // Optional URL for custom search API
  dataDetails: {
    titleKey: string
    descriptionKey: string
    dataKey: string // Access nested data from response
  }
  id?: string // Optional ID for the input element
  clearOnSelect?: boolean // Optional prop to clear input on result select
  emphasis?: {
    key: string
    text: string
    condition?: (result: SearchResult) => boolean
  }
}

export default function SearchField({
  placeholder = "Search...",
  debounceMs = 300,
  minQueryLength = 2,
  onResultSelect,
  className = "",
  searchUrl,
  dataDetails,
  id,
  clearOnSelect,
  emphasis,
}: SearchFieldProps) {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set())
  const debouncedQuery = useDebounce(query, debounceMs)

  // React Query for search
  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchAPI(searchUrl, debouncedQuery),
    enabled: debouncedQuery.length >= minQueryLength,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setIsOpen(value.length > 0)
  }

  const handleClear = () => {
    setQuery("")
    setIsOpen(false)
  }

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result)
    setIsOpen(false)
    setQuery(result[dataDetails.titleKey])

    // Toggle the item in addedItems
    setAddedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(result.id)) {
        newSet.delete(result.id)
      } else {
        newSet.add(result.id)
      }
      return newSet
    })

    if (clearOnSelect) {
      setQuery("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
    }
  }

  const results = data?.[dataDetails.dataKey] || []

  const showResults = isOpen && debouncedQuery.length >= minQueryLength
  const hasResults = results && results.length > 0

  return (
    <div
      className={`relative text-left w-full ${className}`}
      id={id}
      aria-label="Search Field"
    >
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="pl-10 pr-10"
          aria-label="Search"
          aria-expanded={showResults}
          aria-haspopup="listbox"
          role="combobox"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 p-0"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isFetching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <Card className="absolute top-full z-50 mt-1 w-full max-h-[80vh] overflow-hidden shadow-lg">
          <div className="max-h-[80vh] overflow-y-auto">
            {/* Loading State */}
            {isLoading && (
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}

            {/* Error State */}
            {error && (
              <Alert className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to search. Please try again.
                </AlertDescription>
              </Alert>
            )}

            {/* No Results */}
            {!isLoading &&
              !error &&
              debouncedQuery.length >= minQueryLength &&
              !hasResults && (
                <div className="p-4 text-center text-muted-foreground">
                  <Search className="mx-auto h-8 w-8 mb-2 opacity-50 " />
                  <p>No results found for "{debouncedQuery}"</p>
                  <p className="text-sm mt-1">
                    Try adjusting your search terms
                  </p>
                </div>
              )}

            {/* Results */}
            {hasResults && (
              <div role="listbox" aria-label="Search results">
                {results.map((result: SearchResult) => (
                  <div
                    key={result.id}
                    role="option"
                    tabIndex={0}
                    className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 focus:bg-accent focus:outline-none"
                    onClick={() => handleResultClick(result)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handleResultClick(result)
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm break-words capitalize "
                        >
                          {highlightSearchTerm(
                            result[dataDetails.titleKey].toLowerCase(),
                            debouncedQuery
                          )}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 break-words capitalize">
                          {highlightSearchTerm(
                            result[dataDetails.descriptionKey].toLowerCase(),
                            debouncedQuery
                          )}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {addedItems.has(result.id) ? (
                          <Check className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Plus className="h-5 w-5 text-primary hover:text-primary/80 transition-colors" />
                        )}
                      </div>
                    </div>
                    {emphasis && result[emphasis.key] && (!emphasis.condition || emphasis.condition(result)) && (
                      <SearchFieldEmphasis text={emphasis.text} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Query too short */}
            {debouncedQuery.length > 0 &&
              debouncedQuery.length < minQueryLength && (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">
                    Type at least {minQueryLength} characters to search
                  </p>
                </div>
              )}
          </div>
        </Card>
      )}
    </div>
  )
}

export function SearchFieldEmphasis({ text }: { text: string }) {
  return (
    <div className="mt-2 text-xs bg-muted rounded-md px-2 py-1 flex items-center gap-2">
      <Sparkles className="inline size-3 text-[#1EDD05]" fill="#1EDD05" />
      <span>{text}</span>
    </div>
  )
}
