import { FileSearch } from "lucide-react"
import { FacilityDetail } from "../types"
import { AvailablePromosSection } from "./AvailablePromosSection"
import { ServicesOfferedSection } from "./ServicesOfferedSection"
import { FacilityMedicationStock } from "./FacilityMedicationStock"

interface AboutTabProps {
  facility: FacilityDetail
}

export function AboutTab({ facility }: AboutTabProps) {
  const hasPromos = facility.activeDiscounts.length > 0
  const hasServices = (facility.services?.length ?? 0) > 0

  return (
    <div className="flex flex-col gap-6 px-4 py-4">
      <FacilityMedicationStock facilityId={facility.id} />
      {hasPromos && (
        <AvailablePromosSection
          facilityId={facility.id}
          facilityName={facility.name}
          promos={facility.activeDiscounts}
        />
      )}
      {hasServices && <ServicesOfferedSection services={facility.services} />}
      {!hasPromos && !hasServices && <EmptyState />}
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
