import { lazy, Suspense } from "react"
import { TabsContent } from "@radix-ui/react-tabs"
import { DashboardSection } from "./components/DashboardStagger"
import { DashboardSkeleton } from "./components/DashboardSkeleton"

const CareCompanionHome = lazy(
  () => import("../CareCompanion/CareCompanionHome")
)

export default function PatientDashboardCareTab() {
  return (
    <TabsContent value="care" className="flex flex-col gap-7">
      <DashboardSection mode="switch">
        <Suspense fallback={<DashboardSkeleton />}>
          <CareCompanionHome />
        </Suspense>
      </DashboardSection>
    </TabsContent>
  )
}
