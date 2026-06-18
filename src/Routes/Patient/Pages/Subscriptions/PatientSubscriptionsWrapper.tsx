import { Routes, Route } from "react-router-dom"
import RouteMetadata from "@/components/RouteMetadata"
import PatientSubscriptionsTransactionResult from "./PatientSubscriptionsTransactionResult"

export default function PatientSubscriptionsWrapper() {
  return (
    <Routes>
      <Route
        path="/transaction-result"
        element={
          <RouteMetadata title="Transaction Result">
            <PatientSubscriptionsTransactionResult />
          </RouteMetadata>
        }
      ></Route>
    </Routes>
  )
}
