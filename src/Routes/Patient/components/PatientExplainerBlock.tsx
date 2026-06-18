import { cn } from "@/lib/utils"
import { cva } from "class-variance-authority"
import { CircleCheck, Hourglass } from "lucide-react"

const explainerVariants = cva(
  "p-3 flex gap-5 items-center font-normal text-lg rounded-xl",
  {
    variants: {
      variant: {
        current: "text-primary border border-primary",
        next: "text-secondary-foreground filter grayscale border",
        completed: "bg-neutral-100 text-accent-foreground ",
        info: "bg-neutral-100 text-accent-foreground ",
      },
    },
    defaultVariants: {
      variant: "current",
    },
  }
)
export default function ExplainerBlock({
  icon,
  title,
  variant,
  className,
}: {
  icon: React.ReactNode
  title: string
  variant: "current" | "next" | "completed" | "info"
  className?: string
}) {
  return (
    <div className={cn(explainerVariants({ variant, className }))}>
      {icon}
      {title}
      {variant === "completed" && (
        <CircleCheck className="text-green-500 w-10 h-10 ml-auto" />
      )}

      {(variant === "next" || variant === "current") && (
        <Hourglass className="text-primary w-10 h-10 ml-auto" />
      )}
    </div>
  )
}
