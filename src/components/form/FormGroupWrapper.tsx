import { cn } from "@/lib/utils"

export default function FormGroupWrapper({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("flex flex-col gap-2 text-left w-full", className)}>
      {children}
    </div>
  )
}
