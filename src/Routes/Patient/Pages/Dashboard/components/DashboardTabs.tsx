interface DashboardTabsProps {
  activeTab: "payments" | "loans" | "cashback"
  onTabChange: (tab: "payments" | "loans" | "cashback") => void
}

export function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  const tabs = ["payments", "loans", "cashback"] as const
  const activeIndex = tabs.indexOf(activeTab)

  return (
    <div className="relative flex p-1 bg-[#F3E8FF] rounded-xl w-full isolate">
      <div 
          className="absolute top-1 bottom-1 bg-[#8B5CF6] rounded-lg shadow-md transition-all duration-300 ease-out -z-10"
          style={{
              width: `calc((100% - 8px) / 3)`,
              left: `calc(4px + ${activeIndex} * ((100% - 8px) / 3))`
          }}
      />
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 capitalize z-10 ${
            activeTab === tab 
              ? "text-white" 
              : "text-[#9333EA] hover:bg-white/10"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
