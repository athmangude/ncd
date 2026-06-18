import { TabsContent } from "@radix-ui/react-tabs"
import { PatientCareFund } from "../PatientCareFund/PatientCareFund"

export default function PatientDashboardSavingsTab() {
  return (
    <TabsContent value="savings" className="flex flex-col gap-7">
      <PatientCareFund />
    </TabsContent>
  )
}
