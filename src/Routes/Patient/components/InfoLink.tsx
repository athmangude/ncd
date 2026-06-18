import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

// Define variants for InfoLink
const infoLinkVariants = cva(
  "flex items-center justify-between gap-3 rounded-xl shadow-lg px-3 py-4 border no-underline text-left",
  {
    variants: {
      variant: {
        default: "",
        emphasized: "border-2 border-primary border-primary bg-primary/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export function InfoLink({
  href,
  icon,
  title,
  description,
  variant,
}: {
  href: string
  icon: any
  title: string
  description: string
} & VariantProps<typeof infoLinkVariants>) {
  return (
    <Link to={href} className={infoLinkVariants({ variant })}>
      <img
        src={icon}
        alt="icon"
        className="w-16 aspect-square p-2 object-contain"
        aria-hidden="true"
      />

      <div className="flex flex-col text-xs gap-1">
        <p className="text-base text-black font-medium">{title}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>

      <div
        className="aspect-square h-8 bg-black text-white rounded-full grid place-content-center"
        aria-hidden="true"
      >
        <ChevronRight className="w-4 h-4" />
      </div>
    </Link>
  )
}

export function InfoLinkButton({
  onClick,
  icon,
  title,
  description,
  variant,
}: {
  onClick: () => void
  icon: any
  title: string
  description: string
} & VariantProps<typeof infoLinkVariants>) {
  return (
    <button
      className={infoLinkVariants({ variant })}
      type="button"
      role="link"
      onClick={onClick}
    >
      <img
        src={icon}
        alt="icon"
        className="w-16 aspect-square p-2 object-contain"
        aria-hidden="true"
      />

      <div className="flex flex-col text-xs gap-1">
        <p className="text-base text-black font-medium">{title}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>

      <div
        className="aspect-square h-8 bg-black text-white rounded-full grid place-content-center"
        aria-hidden="true"
      >
        <ChevronRight className="w-4 h-4" />
      </div>
    </button>
  )
}
