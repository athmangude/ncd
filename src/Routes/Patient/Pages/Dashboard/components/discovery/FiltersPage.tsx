import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft, Settings2 } from "lucide-react"
import AppShell from "@/Routes/AppShell"
import { Button } from "@/components/Button"
import { trackEvent, EVENTS } from "@/analytics"
import { DISCOVERY_STORAGE_KEY } from "./useDiscovery"
import { useServiceCategories } from "./api/useServiceCategories"
import { JirehPartnersToggle } from "./components/JirehPartnersToggle"
import { ServiceCategoryChips } from "./components/ServiceCategoryChips"
import { SectionTitle } from "@/components/SectionTitle"

function readPersistedState(): {
  activeTab?: "all" | "jireh"
  serviceCategories?: string[]
} {
  try {
    const raw = sessionStorage.getItem(DISCOVERY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function mergePersistedState(patch: {
  activeTab: "all" | "jireh"
  serviceCategories: string[]
}) {
  try {
    const existing = readPersistedState()
    const next = { ...existing, ...patch }
    sessionStorage.setItem(DISCOVERY_STORAGE_KEY, JSON.stringify(next))
  } catch (e) {
    console.error("Error persisting discovery filters:", e)
  }
}

export default function FiltersPage() {
  const navigate = useNavigate()
  const categoriesQuery = useServiceCategories()

  // Draft state seeded from sessionStorage and committed only on Apply.
  // We bypass useDiscovery here because (a) FiltersPage does not need the
  // hook's fetch/permission machinery and (b) the hook's sessionStorage
  // writer is debounced 400ms, which is cancelled when this component
  // unmounts on navigate(-1) — so updates would be lost.
  const persisted = readPersistedState()
  const [draftJirehOnly, setDraftJirehOnly] = useState(
    persisted.activeTab === "jireh"
  )
  const [draftCategories, setDraftCategories] = useState<string[]>(
    persisted.serviceCategories ?? []
  )

  useEffect(() => {
    trackEvent(EVENTS.DISCOVERY.FILTERS_OPEN)
  }, [])

  const toggleCategory = (category: string) => {
    setDraftCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const onApply = () => {
    mergePersistedState({
      activeTab: draftJirehOnly ? "jireh" : "all",
      serviceCategories: draftCategories,
    })
    trackEvent(EVENTS.DISCOVERY.FILTERS_APPLY, {
      jirehOnly: draftJirehOnly,
      serviceCategoryCount: draftCategories.length,
      categories: draftCategories.join(","),
    })
    navigate(-1)
  }

  const onCancel = () => navigate(-1)

  const header = (
    <div className="bg-card flex items-center gap-2 px-4 py-3 border-b border-border">
      <Button
        variant="outline"
        size="icon"
        onClick={onCancel}
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </Button>
      <h1>Filters</h1>
    </div>
  )

  const footer = (
    <div className="bg-card border-t border-border p-4 flex items-center gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button type="button" onClick={onApply} className="flex-1">
        Apply filters
      </Button>
    </div>
  )

  return (
    <AppShell header={header} footer={footer} className="flex flex-col gap-6">
      <JirehPartnersToggle
        checked={draftJirehOnly}
        onChange={setDraftJirehOnly}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-foreground" />
          <SectionTitle>Services</SectionTitle>
        </div>
        <ServiceCategoryChips
          categories={categoriesQuery.data ?? []}
          selected={draftCategories}
          onToggle={toggleCategory}
          isLoading={categoriesQuery.isLoading}
          isError={categoriesQuery.isError}
          onRetry={() => categoriesQuery.refetch()}
        />
      </div>
    </AppShell>
  )
}
