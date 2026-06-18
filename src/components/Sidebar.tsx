import { Link } from "react-router-dom"
import { ReactNode } from "react"

interface SidebarProps {
  children: ReactNode
  className?: string
}

export function Sidebar({ children, className = "" }: SidebarProps) {
  return (
    <aside
      className={`w-64 min-h-[90vh] px-5 py-10 overflow-y-auto border-r fixed hidden md:flex left-0 top-16 flex-col h-full z-50 bg-white ${className}`}
    >
      <div className="flex flex-col justify-between h-full gap-7">
        {children}
      </div>
    </aside>
  )
}

interface SidebarSectionProps {
  children: ReactNode
  className?: string
}

export function SidebarSection({
  children,
  className = "",
}: SidebarSectionProps) {
  return (
    <li className={`flex flex-col gap-7 border-b pb-4 ${className}`}>
      {children}
    </li>
  )
}

interface SidebarSubsectionProps {
  title?: string
  children: ReactNode
}

export function SidebarSubsection({ title, children }: SidebarSubsectionProps) {
  return (
    <div className="flex flex-col gap-1">
      {title && (
        <h2 className="font-medium text-neutral-500 uppercase text-sm">{title}</h2>
      )}
      <ul className="flex flex-col gap-2 mt-1">{children}</ul>
    </div>
  )
}

interface SidebarLinkProps {
  to: string
  children: ReactNode
  onClick?: () => void
  isActive?: boolean
}

export function SidebarLink({ to, onClick, children }: SidebarLinkProps) {
  return (
    <Link
      to={to}
      className={`flex gap-2 items-center px-2 py-2 text-neutral-700 no-underline hover:text-primary hover:bg-neutral-100 `}
      onClick={onClick}
    >
      {children}
    </Link>
  )
}
