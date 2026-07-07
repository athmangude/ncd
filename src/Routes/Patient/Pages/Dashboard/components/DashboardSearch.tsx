import { Search, SlidersHorizontal } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function DashboardSearch() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <div className="flex flex-col items-center w-full text-center">
        <h1>Find care near you</h1>
        <p className="text-sm text-muted-foreground">
          Search by name, area, or service.
        </p>
      </div>
      <div className="flex items-center gap-2 h-11 w-full border border-border rounded-full pl-3 pr-2 bg-card shadow-sm">
        <button
          type="button"
          onClick={() => navigate("/patients/search")}
          aria-label="Search facilities"
          className="flex flex-1 min-w-0 items-center gap-2 h-full text-left"
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 min-w-0 text-base text-muted-foreground truncate">
            Search facilities
          </span>
        </button>
        <button
          type="button"
          onClick={() => navigate("/patients/search/filters")}
          aria-label="Open filters"
          className="flex items-center gap-1.5 h-6 px-3 bg-purple-100 text-purple-800 text-sm font-medium rounded-full shrink-0"
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filter
        </button>
      </div>
    </div>
  )
}
