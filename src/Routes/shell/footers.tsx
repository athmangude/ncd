import React from "react"
import { Home, Search, User, Orbit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"

// ─── Footer slot components ───────────────────────────────────────────────────
// Pinned bottom bars for the AppShell `footer` slot. Safe-area bottom inset is
// applied by AppShell, so these components only describe the bar itself.

export type NavTab = "home" | "explore" | "circle" | "profile"

interface NavFooterProps {
  activeTab?: NavTab
  onTabChange?: (tab: NavTab) => void
  className?: string
}

export function NavFooter({
  activeTab = "home",
  onTabChange,
  className,
}: NavFooterProps) {
  const items: { id: NavTab; icon: React.ReactNode; label: string }[] = [
    { id: "home", icon: <Home size={22} />, label: "Home" },
    { id: "explore", icon: <Search size={22} />, label: "Explore" },
    { id: "circle", icon: <Orbit size={22} />, label: "Circle" },
    { id: "profile", icon: <User size={22} />, label: "Profile" },
  ]

  return (
    <nav
      className={cn(
        "h-16 border-t bg-white dark:bg-neutral-950 flex items-center justify-around pb-2",
        className
      )}
    >
      {items.map((item) => (
        <NavItem
          key={item.id}
          icon={item.icon}
          label={item.label}
          active={activeTab === item.id}
          onClick={() => onTabChange?.(item.id)}
        />
      ))}
    </nav>
  )
}

interface PrimaryCTAFooterProps {
  label: React.ReactNode
  onClick?: () => void
  type?: "submit" | "button" | "reset"
  form?: string
  disabled?: boolean
  isLoading?: boolean
  className?: string
}

export function PrimaryCTAFooter({
  label,
  onClick,
  type = "button",
  form,
  disabled,
  isLoading,
  className,
}: PrimaryCTAFooterProps) {
  return (
    <div
      className={cn(
        "border-t bg-white dark:bg-neutral-950 flex items-center p-4",
        className
      )}
    >
      <Button
        className="w-full"
        onClick={onClick}
        type={type}
        form={form}
        disabled={disabled ?? isLoading}
      >
        {label}
      </Button>
    </div>
  )
}

interface DualActionFooterProps {
  primary: {
    label: React.ReactNode
    onClick: () => void
    disabled?: boolean
    isLoading?: boolean
  }
  secondary: {
    label: React.ReactNode
    onClick: () => void
    disabled?: boolean
  }
  className?: string
}

export function DualActionFooter({
  primary,
  secondary,
  className,
}: DualActionFooterProps) {
  return (
    <div
      className={cn(
        "border-t bg-white dark:bg-neutral-950 flex items-center p-4 gap-2",
        className
      )}
    >
      <Button
        variant="outline"
        onClick={secondary.onClick}
        disabled={secondary.disabled}
      >
        {secondary.label}
      </Button>
      <Button
        className="w-full"
        onClick={primary.onClick}
        disabled={primary.disabled ?? primary.isLoading}
      >
        {primary.label}
      </Button>
    </div>
  )
}

// ─── NavItem helper ───────────────────────────────────────────────────────────

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-full h-full gap-1 rounded-none",
        active
          ? "text-purple-600 dark:text-purple-400"
          : "text-neutral-500 hover:text-neutral-900"
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  )
}
