import SearchField, { SearchFieldEmphasis } from "@/components/SearchField"
import PatientPageWrapper from "./PatientPageWrapper"
import careProviderIcon from "@/assets/icons/care-provider.png"
import { useState } from "react"

export default function PatientDiscoverHospitals() {
  const [careProvider, setCareProvider] = useState<any>(null)

  return (
    <PatientPageWrapper title="Discover our Hospitals" className="text-center">
      <img
        src={careProviderIcon}
        alt="Care Provider Icon"
        className="w-full max-w-[80px] mx-auto my-3"
        aria-hidden="true"
      />
      <h1 className="text-2xl font-medium">Discover our hospitals</h1>
      <p className="text-neutral-500">
        You can get a discount from some indicated hospitals.
      </p>

      <SearchField
        searchUrl="/patients/search-facilities"
        dataDetails={{
          titleKey: "name",
          descriptionKey: "plotNumber",
          dataKey: "facilities",
        }}
        onResultSelect={(result) => {
          setCareProvider(result)
        }}
        placeholder="Type to search for a care provider"
        emphasis={{
          key: "facility",
          text: "Earn cashback here with Jireh",
        }}
      />

      {careProvider && (
        <div className="text-left mt-3 flex flex-col gap-1">
          <h2 className="text-lg font-medium text-neutral-600">
            {careProvider.name}
          </h2>
          <p className="text-sm text-neutral-500">
            {careProvider.plotNumber || "No plot number available"}
          </p>

          {careProvider.facility && (
            <SearchFieldEmphasis text="Earn cashback here with Jireh" />
          )}

          <p className="flex justify-between mt-5 text-lg text-neutral-500 gap-5">
            Facility Type
            <span className="text-neutral-800 text-right">
              {careProvider.facilityType}
            </span>
          </p>
          <p className="flex justify-between mt-5 text-lg text-neutral-500 gap-5">
            Plot No.
            <span className="text-neutral-800 text-right max-w-[15ch]">
              {careProvider.plotNumber}
            </span>
          </p>
          <p className="flex justify-between mt-5 text-lg text-neutral-500 gap-5">
            County
            <span className="text-neutral-800 text-right">
              {careProvider.county}
            </span>
          </p>
        </div>
      )}
    </PatientPageWrapper>
  )
}
