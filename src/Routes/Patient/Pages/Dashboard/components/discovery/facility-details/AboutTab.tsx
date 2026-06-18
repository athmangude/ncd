import { FileSearch } from "lucide-react"
import { FacilityDetail } from "../types"
import { AvailablePromosSection } from "./AvailablePromosSection"
import { ServicesOfferedSection } from "./ServicesOfferedSection"

interface AboutTabProps {
  facility: FacilityDetail
}

export function AboutTab({ facility }: AboutTabProps) {
  const hasPromos = facility.activeDiscounts.length > 0
  const hasServices = (facility.services?.length ?? 0) > 0

  if (!hasPromos && !hasServices) {
    return <EmptyState />
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      {hasPromos && (
        <AvailablePromosSection
          facilityId={facility.id}
          facilityName={facility.name}
          promos={facility.activeDiscounts}
        />
      )}
      {hasServices && <ServicesOfferedSection services={facility.services} />}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      <FileSearch className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground max-w-[28ch]">
        We're still gathering information about this facility.
      </p>
    </div>
  )
}
