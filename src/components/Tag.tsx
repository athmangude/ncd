import { cn } from "@/lib/utils"
export default function Tag({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        " bg-green-500 h-fit text-white px-3 py-1 font-medium w-fit grid place-content-center uppercase text-sm text-center rounded-full",
        className
      )}
    >
      {children}
    </div>
  )
}
