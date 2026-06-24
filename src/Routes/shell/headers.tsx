import React from "react"
import { ChevronLeft, Bell } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/Button"
import Logo from "@/assets/icons/full-logo.svg"
import whatsApp from "@/assets/icons/whatsapp.svg"

// ─── Header slot components ───────────────────────────────────────────────────
// Pinned top bars for the AppShell `header` slot. Safe-area top inset is applied
// by AppShell, so these components only describe the bar itself.

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
