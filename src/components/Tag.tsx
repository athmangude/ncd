import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const tagVariants = cva(
  "h-fit text-white px-3 py-1 font-medium w-fit grid place-content-center uppercase text-sm text-center rounded-full",
  {
    variants: {
      variant: {
        success: "bg-success-solid",
        warning: "bg-warning-solid",
        info: "bg-info-solid",
        destructive: "bg-destructive",
        neutral: "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "success",
    },
  }
)

export default function Tag({
  children,
  className,
  variant,
}: {
  children: React.ReactNode
  className?: string
} & VariantProps<typeof tagVariants>) {
  return (
    <div className={cn(tagVariants({ variant }), className)}>{children}</div>
  )
}
