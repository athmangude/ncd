import SearchField from "@/components/SearchField"
import PatientPageWrapper from "../PatientPageWrapper"
import { useEffect, useState } from "react"
import { searchFacilitiesSupabase } from "@/lib/searchFacilitiesSupabase"
import DeletableItem from "../../components/DeletableItem"
import FormGroupWrapper from "@/components/form/FormGroupWrapper"
import { usePersistentForm } from "@/hooks/usePersistentForm"
import useNextCareProfileStep from "../../hooks/useNextCareProfileStep"
import { DualActionFooter } from "@/Routes/shell/footers"
import { patientMembershipStorageKey } from "./PatientReviewMembershipDetails"

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
      variant="content"
      barTitle="Preferred hospitals"
      headerAlign="start"
      pageTitle="Add your preferred hospitals"
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
      <form className="flex flex-col gap-5 w-full" onSubmit={onSubmit}>
        <FormGroupWrapper>
          <SearchField
            searchFn={searchFacilitiesSupabase}
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
