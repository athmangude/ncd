import { Search, SlidersHorizontal } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Chip } from "@/components/Chip"

export function DashboardSearch() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      {/* Matches the explore-tab search bar (DiscoveryHomeView) so the two
          dashboard search entry points look identical. */}
      <div className="flex items-center gap-2 h-11 w-full border border-border rounded-full pl-3 pr-2 bg-card shadow-sm">
        <button
          type="button"
          onClick={() => navigate("/patients/search")}
          aria-label="Find care near you"
          className="flex flex-1 min-w-0 items-center gap-2 h-full text-left"
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="flex-1 min-w-0 text-base text-muted-foreground truncate">
            Find care near you
          </span>
        </button>
        <Chip
          onClick={() => navigate("/patients/search/filters")}
          aria-label="Open filters"
          className="shrink-0"
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filter
        </Chip>
      </div>
    </div>
  )
}
