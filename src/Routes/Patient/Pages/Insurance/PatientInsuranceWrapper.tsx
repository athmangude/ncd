import { Route, Routes } from "react-router-dom"
import RouteMetadata from "@/components/RouteMetadata"
import PatientInsuranceChoosePlan from "./PatientInsuranceChoosePlan"
import PatientInsuranceAddBeneficiaries from "./PatientInsuranceAddBeneficiaries"
import PatientInsurancePayForCover from "./PatientInsurancePayForCover"

export default function PatientInsuranceWrapper() {
  return (
    <Routes>
      <Route
        path="/choose-plan"
        element={
          <RouteMetadata title="Choose insurance plan">
            <PatientInsuranceChoosePlan />
          </RouteMetadata>
        }
      />

      <Route
        path="/add-beneficiaries"
        element={
          <RouteMetadata title="Add Beneficiaries">
            <PatientInsuranceAddBeneficiaries />
          </RouteMetadata>
        }
      />

      <Route
        path="/pay-for-cover"
        element={
          <RouteMetadata title="Pay for your cover">
            <PatientInsurancePayForCover />
          </RouteMetadata>
        }
      />
    </Routes>
  )
}
