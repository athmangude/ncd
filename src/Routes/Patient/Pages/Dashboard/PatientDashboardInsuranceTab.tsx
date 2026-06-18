import { TabsContent } from "@radix-ui/react-tabs"
import { InsurancePlan } from "../Onboarding/PatientInsurancePlan"

export default function PatientDashboardInsuranceTab() {
  return (
    <TabsContent value="insurance">
      <InsurancePlan />
    </TabsContent>
  )
}
