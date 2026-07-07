import React from "react"
import { Button } from "@/components/Button"

interface DashboardCTAProps {
  icon: React.ReactNode
  title: string
  onClick: () => void
}

export function DashboardCTA({ icon, title, onClick }: DashboardCTAProps) {
  return (
    <Button variant="secondary" onClick={onClick} className="w-full">
      {icon}
      {title}
    </Button>
  )
}
