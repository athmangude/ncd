import React from "react"

interface DashboardCTAProps {
  icon: React.ReactNode
  title: string
  onClick: () => void
}

export function DashboardCTA({ icon, title, onClick }: DashboardCTAProps) {
  return (
    <button
      className="bg-[#F3E8FF] hover:bg-[#E9D5FF] rounded-2xl flex flex-col items-start justify-between p-4 h-auto min-h-[100px] transition-colors w-full gap-2"
      onClick={onClick}
    >
      <div className="">
        {icon}
      </div>

      <span className="text-neutral-900 font-medium text-left leading-tight">{title}</span>
    </button>
  )
}
