import { TabsContent } from "@radix-ui/react-tabs"
import { HeartPulse } from "lucide-react"
import { DashboardSection } from "./components/DashboardStagger"

export default function PatientDashboardCareTab() {
  return (
    <TabsContent value="care" className="flex flex-col gap-7">
      <DashboardSection mode="enter">
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-accent">
            <HeartPulse className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-sans text-xl font-semibold text-foreground">
            Care Companion
          </h2>
          <p className="font-sans text-sm text-muted-foreground text-center max-w-xs">
            Your medication tracking, emergency cards, and health information
            will appear here.
          </p>
        </div>
      </DashboardSection>
    </TabsContent>
  )
}
