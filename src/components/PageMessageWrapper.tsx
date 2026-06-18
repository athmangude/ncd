import { ReactNode } from "react"
import { CircleAlert, CircleCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export type PageMessageVariant = "error" | "success"

interface PageMessageWrapperProps {
  /** "error" shows alert icon (red), "success" shows check icon (green) */
  variant: PageMessageVariant
  title: string
  message?: string
  /** Optional custom icon; overrides default for variant */
  icon?: ReactNode
  /** Action buttons or links (e.g. Retry, Back to dashboard) */
  children?: ReactNode
  /** Use full viewport height (e.g. for route-level error page) */
  fullScreen?: boolean
  className?: string
}

const defaultIcons: Record<PageMessageVariant, ReactNode> = {
  error: <CircleAlert className="h-16 w-16 text-red-500" aria-hidden />,
  success: <CircleCheck className="h-16 w-16 text-green-500" aria-hidden />,
}

/**
 * Shared layout for full-page error and success states.
 * Use for ErrorBlock, ErrorPage, and success screens so they look consistent.
 */
export function PageMessageWrapper({
  variant,
  title,
  message,
  icon,
  children,
  fullScreen = false,
  className,
}: PageMessageWrapperProps) {
  const displayIcon = icon ?? defaultIcons[variant]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-4",
        fullScreen ? "min-h-screen bg-background" : "min-h-[60vh]",
        className
      )}
    >
      <div className="flex flex-col gap-3 max-w-md">
        {displayIcon}
        <h1 className="text-xl font-bold text-neutral-900 sm:text-2xl">{title}</h1>
        {message && (
          <p className="text-sm text-neutral-600 sm:text-base text-pretty">
            {message}
          </p>
        )}
        {children && <div className="flex flex-col gap-2 mt-2">{children}</div>}
      </div>
    </div>
  )
}
