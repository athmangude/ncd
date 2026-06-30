import { Tabs, TabsList, TabsTrigger } from "@/components/Tabs"

type DashboardTab = "payments" | "loans" | "cashback"

interface DashboardTabsProps {
  activeTab: DashboardTab
  onTabChange: (tab: DashboardTab) => void
}

const TABS: DashboardTab[] = ["payments", "loans", "cashback"]

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => onTabChange(value as DashboardTab)}
      className="w-full"
    >
      <TabsList className="w-full">
        {TABS.map((tab) => (
          <TabsTrigger key={tab} value={tab} className="flex-1 capitalize">
            {tab}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
