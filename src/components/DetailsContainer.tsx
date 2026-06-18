import { cn } from "@/lib/utils"

export function DetailsContainer({
  className,
  children,
  title,
  description,
}: {
  className?: string
  children: React.ReactNode
  title?: string
  description?: string
}) {
  return (
    <section className="max-w-3xl flex flex-col gap-5">
      {title && <h2 className="text-xl capitalize">{title}</h2>}
      {description && <p className="text-neutral-500">{description}</p>}

      <div className={cn("flex flex-col rounded-lg border", className)}>
        {children}
      </div>
    </section>
  )
}

export function DetailsContainerRow({
  label,
  value,
  className,
}: {
  label: React.ReactNode
  value: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-5 justify-between p-4 border-b last:border-b-0",
        className
      )}
    >
      <div className="text-neutral-500">{label}</div>
      <div>{value}</div>
    </div>
  )
}
