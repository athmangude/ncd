import { Check, ChevronRight, Star } from "lucide-react"

export function PatientPlan({
  name,
  price,
  descriptions,
  cta,
  isActive,
}: {
  name: string
  price?: {
    title: string
    subtitle?: string
  }
  descriptions: {
    title: string
    description?: string
  }[]
  cta: {
    title: string
    onClick: () => void
  }
  isActive?: boolean
}) {
  return (
    <div
      className={`flex flex-col  rounded-lg border ${isActive && "border-primary"}`}
    >
      <div className="flex items-center justify-between px-5 py-2 border-b">
        <div className="flex items-center gap-2">
          {isActive && <Star className="w-5 h-5 text-primary" />}
          <p className="font-medium text-xl">{name}</p>
        </div>

        {price && (
          <div className="flex flex-col items-center gap-1">
            <span
              className={`flex items-center rounded-full  px-3 py-1 text-sm justify-center w-fit ${isActive ? "bg-primary text-white" : "bg-brand-gradient-200"}`}
            >
              {price.title}
            </span>
            {price.subtitle && (
              <p className="text-sm text-muted-foreground">{price.subtitle}</p>
            )}
          </div>
        )}
      </div>

      <ul className="border-b py-3">
        {descriptions.map((description, index) => (
          <li key={index} className="flex  gap-2  px-5 py-2">
            <Check className="w-5 h-5 min-w-5 mt-1" />
            <div>
              <p className="font-medium">{description.title}</p>
              {description.description && (
                <p className="text-sm text-muted-foreground">
                  {description.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <button
        className={`flex items-center justify-center text-center gap-2 font-medium h-full py-3 ${isActive ? "bg-primary text-white" : "bg-brand-gradient-200"}`}
        onClick={cta.onClick}
      >
        {cta.title}
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  )
}
