import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Check, ChevronRight } from "lucide-react"
import { DialogTrigger } from "@/components/Dialog"
import { Button } from "@/components/Button"

const bannerItemVariants = cva(
  "rounded-lg flex flex-col justify-between gap-3 p-4 border w-52 aspect-[1/1] bg-white",
  {
    variants: {
      variant: {
        default: "border-neutral-300",
        active: "bg-bubblegum-100 border-bubblegum-200 font-medium",
        final: "items-center text-center justify-center filter grayscale",
        completed: "bg-neutral-50 border-neutral-50",
        finalCompleted:
          "bg-bubblegum-100 border-bubblegum-200 items-center text-center justify-center",
      },
    },
  }
)

const stepCounterVariants = cva(
  "h-8 w-8 rounded-full grid place-content-center font-medium text-lg p-2 border ",
  {
    variants: {
      variant: {
        active: "bg-primary border-primary text-white",
        default: "bg-white",
        final: "hidden",
        completed: "",
        finalCompleted: "hidden",
      },
    },
  }
)

export function BannerItem({
  title,
  ctaText,
  icon,
  className,
  variant,
  step,
}: {
  title: string
  step: number
  ctaText?: string
  icon: React.ReactNode
  className?: string
  variant: "active" | "default" | "final" | "completed" | "finalCompleted"
}) {
  return (
    <div className={cn(bannerItemVariants({ variant, className }))}>
      <div className="flex gap-2 justify-between items-center">
        <div className={cn(stepCounterVariants({ variant }))}>
          {variant === "completed" ? (
            <Check className="h-5 w-5 text-neutral-800" />
          ) : (
            step
          )}
        </div>

        <div className="" aria-hidden="true">
          {icon}
        </div>
      </div>

      <p className="text-lg ">{title}</p>

      {ctaText && variant !== "completed" && (
        <DialogTrigger asChild>
          <Button className={`w-full`} disabled={variant !== "active"}>
            {ctaText}

            <ChevronRight className="h-5 w-5 mt-0.5" />
          </Button>
        </DialogTrigger>
      )}
    </div>
  )
}
