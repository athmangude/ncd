import React from "react"

interface DashboardCTAProps {
  icon: React.ReactNode
  title: string
  onClick: () => void
}

export function DashboardCTA({ icon, title, onClick }: DashboardCTAProps) {
  return (
    <button
      className="bg-secondary hover:bg-secondary/80 rounded-2xl flex flex-col items-start justify-between p-4 h-auto min-h-[100px] transition-colors w-full gap-2"
      onClick={onClick}
    >
      <div className="">
        {icon}
      </div>

      <span className="text-foreground font-medium text-left leading-tight">{title}</span>
    </button>
  )
}
