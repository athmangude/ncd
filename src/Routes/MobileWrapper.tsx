import React from "react"
import { ChevronLeft, Home, Search, User, Bell, Orbit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"
import Logo from "@/assets/icons/full-logo.svg"
import whatsApp from "@/assets/icons/whatsapp.svg"

// ─── Header sub-components ────────────────────────────────────────────────────

interface LogoHeaderProps {
  showIcons?: boolean
  /** Wraps the logo in a clickable button — use to navigate home */
  onLogoClick?: () => void
  /** When provided, renders the WhatsApp icon as an external <a> link */
  messageHref?: string
  onMessageClick?: () => void
  onBellClick?: () => void
  /** When > 0, shows a notification badge on the bell icon */
  unreadCount?: number
  className?: string
}

export function LogoHeader({
  showIcons = true,
  onLogoClick,
  messageHref,
  onMessageClick,
  onBellClick,
  unreadCount,
  className,
}: LogoHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between p-2 border-b bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md z-10 sticky top-0",
        className
      )}
    >
      {onLogoClick ? (
        <button
          onClick={onLogoClick}
          className="p-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Go to home"
        >
          <img src={Logo} alt="Jireh Logo" className="h-8" />
        </button>
      ) : (
        <div className="p-1">
          <img src={Logo} alt="Jireh Logo" className="h-8" />
        </div>
      )}

      {showIcons && (
        <div className="flex items-center">
          {messageHref ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 hover:bg-green-50"
              aria-label="WhatsApp"
            >
              <a href={messageHref} target="_blank" rel="noopener noreferrer">
                <img src={whatsApp} alt="" className="w-6 h-6" />
              </a>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={onMessageClick}
              aria-label="Message"
            >
              <img src={whatsApp} alt="" className="w-6 h-6" />
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="relative h-10 w-10"
            onClick={onBellClick}
            aria-label="Notifications"
          >
            <Bell size={24} />
            {unreadCount != null && unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-white ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </div>
      )}
    </header>
  )
}

interface BackTitleHeaderProps {
  title: string
  onBack?: () => void
  rightSlot?: React.ReactNode
  className?: string
}

export function BackTitleHeader({
  title,
  onBack,
  rightSlot,
  className,
}: BackTitleHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between p-2 border-b bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md z-10 sticky top-0",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={onBack}
        >
          <ChevronLeft size={24} />
        </Button>
        <p className="text-base font-normal text-neutral-900">{title}</p>
      </div>
      {rightSlot != null && <div>{rightSlot}</div>}
    </header>
  )
}

// ─── Footer sub-components ────────────────────────────────────────────────────

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

// ─── MobileWrapper ────────────────────────────────────────────────────────────

interface MobileWrapperProps {
  children: React.ReactNode
  /** Slot for the fixed top bar. Pass null to suppress entirely. */
  header?: React.ReactNode | null
  /** Slot for the fixed bottom area. Pass null to suppress entirely. */
  footer?: React.ReactNode | null
  className?: string
}

export default function MobileWrapper({
  children,
  header,
  footer,
  className,
}: MobileWrapperProps) {
  return (
    <div className="min-h-screen w-full flex justify-center bg-neutral-100 dark:bg-neutral-900">
      <div className="w-full max-w-md bg-white dark:bg-neutral-950 overflow-hidden flex flex-col relative h-[100dvh]">
        {header}
        <main
          className={cn("flex-1 overflow-y-auto p-4 scrollbar-hide", className)}
        >
          {children}
        </main>
        {footer}
      </div>
    </div>
  )
}
