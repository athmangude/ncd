import { Tabs } from "@/components/Tabs"
import { useOutlet } from "react-router-dom"
import { usePatientDashboardTabNavigation } from "./hooks/usePatientDashboardTabNavigation"
import { useTabBarAnimation } from "./hooks/useTabBarAnimation"
import { usePreloadCardImages } from "./hooks/usePreloadCardImages"
import { DashboardTabContent } from "./components/DashboardTabContent"
import { DashboardTabBar } from "./components/DashboardTabBar"

export default function PatientDashboardTabs() {
  const element = useOutlet()
  const { currentTab, direction, handleTabChange, pathname } = usePatientDashboardTabNavigation()
  const { listRef, tabRefs, cx, pathD } = useTabBarAnimation(currentTab)

  usePreloadCardImages()

  return (
    <div className="flex flex-col gap-7 h-full overflow-hidden">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="relative h-full flex flex-col">
        <DashboardTabContent pathname={pathname} direction={direction}>
          {element}
        </DashboardTabContent>

        <DashboardTabBar listRef={listRef} tabRefs={tabRefs} cx={cx} pathD={pathD} />
      </Tabs>
    </div>
  )
}
