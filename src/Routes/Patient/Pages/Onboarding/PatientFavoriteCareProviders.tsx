import SearchField from "@/components/SearchField"
import PatientPageWrapper from "../PatientPageWrapper"
import { useEffect, useState } from "react"
import DeletableItem from "../../components/DeletableItem"
import FormGroupWrapper from "@/components/form/FormGroupWrapper"
import { usePersistentForm } from "@/hooks/usePersistentForm"
import useNextCareProfileStep from "../../hooks/useNextCareProfileStep"
import { Button } from "@/components/Button"
import { DualActionFooter } from "@/Routes/shell/footers"
import { patientMembershipStorageKey } from "./PatientReviewMembershipDetails"
import { ChevronRight, Search } from "lucide-react"

type Inputs = {
  InsuranceProviders: any[]
}

export const selectFavoriteCareProvidersStorageKey =
  "patient-select-favorite-care-providers"

export default function PatientFavoriteCareProviders() {
  const [favoriteCareProviders, setFavoriteCareProviders] = useState<any>([])

  const { handleSubmit } = usePersistentForm<Inputs>(
    selectFavoriteCareProvidersStorageKey
  )

  const { submitStep, skipStep, isSubmitting } = useNextCareProfileStep()

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location access granted", position)
      },
      (error) => {
        console.error("Error requesting location", error)
        if (error.code === error.PERMISSION_DENIED) {
          alert("Please allow location access to find hospitals near you.")
        }
      }
    )
  }

  useEffect(() => {
    // Load existing insurance providers from local storage if available
    const { favoriteCareProviders } = JSON.parse(
      localStorage.getItem(patientMembershipStorageKey) || "{}"
    )

    if (favoriteCareProviders) {
      setFavoriteCareProviders(favoriteCareProviders)
    }
  }, [])

  const onSubmit = handleSubmit(() => {
    const membershipDetails = JSON.parse(
      localStorage.getItem(patientMembershipStorageKey) || "{}"
    )

    localStorage.setItem(
      patientMembershipStorageKey,
      JSON.stringify({
        ...membershipDetails,
        favoriteCareProviders,
      })
    )

    const providerIds = favoriteCareProviders.map((p: any) => p.id)
    submitStep({ favoriteCareProviders: providerIds })
  })

  return (
    <PatientPageWrapper
      title=""
      footer={
        <DualActionFooter
          secondary={{
            label: "Skip",
            onClick: skipStep,
            disabled: isSubmitting,
          }}
          primary={{
            label: "Next",
            onClick: () => onSubmit(),
            disabled: favoriteCareProviders.length === 0,
            isLoading: isSubmitting,
          }}
        />
      }
    >
      <h1 className="text-2xl ">Add your prefferd hospitals</h1>
      <Button
        type="button"
        onClick={requestLocation}
        className="flex items-center justify-between w-full p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5  flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-neutral-600" />
          </div>
          <span className="text-sm font-medium text-neutral-800">
            Find hospitals near me
          </span>
        </div>
        <ChevronRight className="w-5 h-5 text-neutral-600" />
      </Button>
      <form className="flex flex-col gap-5 w-full" onSubmit={onSubmit}>
        <FormGroupWrapper>
          <SearchField
            searchUrl="/patients/search-facilities"
            dataDetails={{
              titleKey: "name",
              descriptionKey: "plotNumber",
              dataKey: "facilities",
            }}
            onResultSelect={(result) => {
              const existingProvider = favoriteCareProviders.find(
                (provider: any) => provider.id === result.id
              )

              if (!existingProvider && favoriteCareProviders.length < 3) {
                setFavoriteCareProviders((prev: any) => [...prev, result])
              }
            }}
            placeholder="Type to search for a care provider"
            clearOnSelect={true}
          />
          <p className="text-sm text-muted-foreground">You can add up to 3 </p>
        </FormGroupWrapper>

        <div className="grid w-full gap-2">
          {favoriteCareProviders.map((provider: any) => (
            <DeletableItem
              key={provider.id}
              title={provider.name}
              description={`${provider.county} • ${provider.plotNumber}`}
              onDelete={() => {
                setFavoriteCareProviders((prev: any) =>
                  prev.filter((p: any) => p.id !== provider.id)
                )
              }}
            />
          ))}
        </div>

        {favoriteCareProviders.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Please add at least one care provider
          </p>
        )}

        {favoriteCareProviders.length === 3 && (
          <p className="text-sm text-muted-foreground">
            Maximum number of care providers reached. Delete one to add a new
            one.
          </p>
        )}
      </form>
    </PatientPageWrapper>
  )
}
