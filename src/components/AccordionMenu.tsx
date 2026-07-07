export default function AccordionMenu({
  title,
  description,
  onClick,
  buttonDisabled,
  buttonLabel,
  icon,
  isRequired,
  active,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  onClick: () => void
  buttonLabel: string
  buttonDisabled: boolean
  active: boolean
  children: React.ReactNode
  isRequired?: boolean
}) {
  return (
    <div className="p-3 border rounded-lg">
      <button
        className="flex items-center gap-5  text-left w-full mb-5"
        aria-label={buttonLabel}
        onClick={onClick}
        disabled={buttonDisabled}
      >
        {icon}

        <div className="">
          <h2 className="font-medium flex gap-3">
            {title}{" "}
            {isRequired && (
              <span className=" rounded-full bg-primary text-white py-1 px-2 text-xs">
                Required
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        </div>

        <span
          className={`mt-1 ml-auto h-[0.5rem] w-[0.5rem] grid place-content-center text-sm transform transition-transform duration-200 origin-center  ${
            active ? "rotate-0" : "rotate-180"
          }`}
          aria-hidden="true"
        >
          ▲
        </span>
      </button>

      {children}
    </div>
  )
}
