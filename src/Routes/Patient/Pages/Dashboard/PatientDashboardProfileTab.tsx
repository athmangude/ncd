import { TabsContent } from "@/components/Tabs"
import PatientProfile from "../Profile/PatientProfile"


export default function PatientDashboardProfileTab() {


  return (
    <TabsContent value="profile" className="flex flex-col w-full gap-5">
     <PatientProfile />
    </TabsContent>
  )
}
