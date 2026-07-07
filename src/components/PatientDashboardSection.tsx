import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

export default function PatientDashboardSection({
  title,
  children,
  className,
  link,
}: {
  title: string
  children: React.ReactNode
  className?: string
  link?: {
    href: string
    text: string
  }
}) {
  return (
    <section className={cn("flex flex-col gap-4", className)}>
      <div className="flex justify-between">
        <h3>{title}</h3>

        {link && (
          <Link
            className="text-muted-foreground no-underline flex items-center"
            to={link.href}
          >
            {link.text}
            <ChevronRight className="w-5 h-5 " />
          </Link>
        )}
      </div>

      {children}
    </section>
  )
}
